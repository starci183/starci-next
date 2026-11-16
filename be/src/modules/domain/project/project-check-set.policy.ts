import { parse } from "yaml"
import { parseCheckFlow } from "@modules/platform/check-flow"
import { isRecord } from "@modules/platform/primitives"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { EVIDENCE_SLOTS, type EvidenceSlot, type LocalizedText } from "./project.contracts"
import type {
    CheckConcept,
    CheckLearnLink,
    CheckMilestone,
    CheckProbe,
    CheckSet,
    CheckSetFiles,
} from "./project-check-set.contracts"

/** The catalog schema the app reads. */
export const CHECK_CATALOG_SCHEMA = "starci-next-data/project-catalog@2"

const refused = (detail: string): ProjectError =>
    new ProjectError({ code: ProjectErrorCode.ChecksUnavailable, params: { detail: detail.slice(0, 200) } })

const yamlOf = (text: string, file: string): unknown => {
    try {
        return parse(text) as unknown
    } catch {
        throw refused(`${file} is not YAML`)
    }
}

const textOf = (raw: unknown, at: string): LocalizedText => {
    if (!isRecord(raw) || typeof raw["vi"] !== "string" || typeof raw["en"] !== "string")
        throw refused(`${at} needs vi and en`)
    return { vi: raw["vi"], en: raw["en"] }
}

const listOf = (raw: unknown, at: string): ReadonlyArray<unknown> => {
    if (!Array.isArray(raw)) throw refused(`${at} must be a list`)
    return raw
}

const idsOf = (raw: unknown, at: string): ReadonlyArray<string> =>
    listOf(raw, at).map((id) => {
        if (typeof id !== "string") throw refused(`${at} holds a non-text id`)
        return id
    })

const slotOf = (raw: unknown, at: string): EvidenceSlot => {
    const slot = EVIDENCE_SLOTS.find((candidate) => candidate === raw)
    if (slot === undefined) throw refused(`${at}: ${String(raw)} is not a slot`)
    return slot
}

const conceptOf = (raw: unknown, index: number): CheckConcept => {
    const at = `concepts.${index}`
    if (!isRecord(raw) || typeof raw["id"] !== "string") throw refused(`${at} needs an id`)
    const kind = raw["kind"]
    if (kind !== "behaviour" && kind !== "structure") throw refused(`${at}.kind`)
    const learn = listOf(raw["learn"] ?? [], `${at}.learn`).map((link): CheckLearnLink => {
        if (!isRecord(link) || typeof link["lesson"] !== "string") throw refused(`${at}.learn`)
        return { lesson: link["lesson"], pending: link["pending"] === true }
    })
    return {
        id: raw["id"],
        label: textOf(raw["label"], `${at}.label`),
        kind,
        http: raw["http"] === true,
        requires: listOf(raw["requires"], `${at}.requires`).map((group, n) =>
            listOf(group, `${at}.requires.${n}`).map((slot) => slotOf(slot, `${at}.requires.${n}`)),
        ),
        probes: idsOf(raw["probes"] ?? [], `${at}.probes`),
        learn,
    }
}

const milestoneOf = (raw: unknown, index: number): CheckMilestone => {
    const at = `milestones.${index}`
    if (!isRecord(raw) || typeof raw["id"] !== "string") throw refused(`${at} needs an id`)
    return {
        id: raw["id"],
        title: textOf(raw["title"], `${at}.title`),
        concepts: idsOf(raw["concepts"], `${at}.concepts`),
    }
}

const probeOf = (file: string, text: string): CheckProbe => {
    const document = yamlOf(text, file)
    const parsed = parseCheckFlow(document)
    if (!parsed.ok) throw refused(`${file}: ${parsed.issues.map((issue) => `${issue.at} ${issue.message}`).join("; ")}`)
    if (!isRecord(document)) throw refused(file)
    const reasonsRaw = document["reasons"]
    const reasons = isRecord(reasonsRaw)
        ? Object.fromEntries(
              Object.entries(reasonsRaw).map(([code, value]) => [code, textOf(value, `${file}.reasons.${code}`)]),
          )
        : {}
    return {
        flow: parsed.flow,
        label: textOf(document["label"], `${file}.label`),
        question: textOf(document["question"], `${file}.question`),
        reasons,
    }
}

/**
 * Reads the check set of one content version from its raw files: the catalog (concepts, milestones, the milestones of each project
 * kind) and every probe flow, each checked by the check-flow schema. Anything that does not hold refuses the whole set, so a run never
 * meets half a catalog; a concept naming a probe that has no file, or a milestone naming an unknown concept, is refused too.
 */
export const checkSetOf = (files: CheckSetFiles): CheckSet => {
    const catalog = yamlOf(files.catalog, "catalog.yaml")
    if (!isRecord(catalog) || catalog["schema"] !== CHECK_CATALOG_SCHEMA)
        throw refused(`catalog.yaml must be ${CHECK_CATALOG_SCHEMA}`)
    const concepts = listOf(catalog["concepts"], "concepts").map(conceptOf)
    const milestones = listOf(catalog["milestones"], "milestones").map(milestoneOf)
    const kindsRaw = catalog["kinds"]
    if (!isRecord(kindsRaw)) throw refused("kinds")
    const kinds = { app: idsOf(kindsRaw["app"], "kinds.app"), agent: idsOf(kindsRaw["agent"], "kinds.agent") }
    const probes = new Map(
        Object.entries(files.probes).map(([file, text]) => {
            const probe = probeOf(file, text)
            if (`${probe.flow.id}.yaml` !== file) throw refused(`${file} must be named ${probe.flow.id}.yaml`)
            return [probe.flow.id, probe] as const
        }),
    )
    const conceptIds = new Set(concepts.map((concept) => concept.id))
    const milestoneIds = new Set(milestones.map((milestone) => milestone.id))
    concepts.forEach((concept) =>
        concept.probes.forEach((id) => {
            if (!probes.has(id)) throw refused(`concept ${concept.id} names probe ${id}, which has no file`)
        }),
    )
    milestones.forEach((milestone) =>
        milestone.concepts.forEach((id) => {
            if (!conceptIds.has(id)) throw refused(`milestone ${milestone.id} names concept ${id}`)
        }),
    )
    ;[...kinds.app, ...kinds.agent].forEach((id) => {
        if (!milestoneIds.has(id)) throw refused(`kinds names milestone ${id}`)
    })
    return { version: files.version, concepts, milestones, kinds, probes }
}
