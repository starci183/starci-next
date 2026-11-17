import { createHash } from "node:crypto"
import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import {
    HARNESS_ID,
    documentOf,
    firstTitleOf,
    runBlocksOf,
    sectionsOf,
    slugOf,
    titledSectionsOf,
    type MarkdownSection,
} from "./harness-markdown.policy"
import {
    HARNESS_LOCALES,
    HARNESS_TOOLS,
    type HarnessBudget,
    type HarnessBuildRecord,
    type HarnessConverted,
    type HarnessDocRecord,
    type HarnessDoctorPackRecord,
    type HarnessFile,
    type HarnessGuideRecord,
    type HarnessIssue,
    type HarnessKeyNeed,
    type HarnessLocale,
    type HarnessProbeRecord,
    type HarnessRawFile,
    type HarnessSectionRecord,
    type HarnessShortcut,
    type HarnessStageRecord,
    type HarnessStepRecord,
    type HarnessTool,
    type HarnessTrapRecord,
    type Localized,
} from "./harness.contracts"

/** The folder of the raw tree this converter reads. */
export const HARNESS_RAW_ROOT = "raw/harness/"

/** The folders a pack never ships. */
const SKIPPED: ReadonlySet<string> = new Set(["node_modules", ".git"])

/** A file of the raw tree with the path relative to `raw/harness/`. */
interface Entry {
    readonly path: string
    readonly text: string
}

const textOf = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value : null)

/** A `{ vi, en }` pair, or one plain string read as both; null for anything else. */
export const localizedOf = (value: unknown): Localized | null => {
    const plain = textOf(value)
    if (plain !== null) return { vi: plain, en: plain }
    if (!isRecord(value)) return null
    const vi = textOf(value["vi"])
    const en = textOf(value["en"])
    return vi === null || en === null ? null : { vi, en }
}

const stringsOf = (value: unknown): ReadonlyArray<string> | null =>
    Array.isArray(value) && value.every((item) => typeof item === "string") ? (value as Array<string>) : null

const yamlOf = (text: string): unknown => {
    try {
        return parse(text)
    } catch {
        return null
    }
}

/** The hash over the path and text of files, sorted by path, so the same files always hash the same. */
export const filesHashOf = (files: ReadonlyArray<{ readonly path: string; readonly text: string }>): string => {
    const hash = createHash("sha256")
    for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
        hash.update(file.path).update("\0").update(file.text).update("\0")
    }
    return hash.digest("hex")
}

const isSkipped = (path: string): boolean => path.split("/").some((part) => SKIPPED.has(part))

/** Groups entries by the first folder under `prefix`: `<prefix>/<name>/<rest>` becomes name -> rest. */
const groupedBy = (entries: ReadonlyArray<Entry>, prefix: string): Map<string, Array<Entry>> => {
    const groups = new Map<string, Array<Entry>>()
    for (const entry of entries) {
        if (!entry.path.startsWith(`${prefix}/`)) continue
        const rest = entry.path.slice(prefix.length + 1)
        const slash = rest.indexOf("/")
        if (slash < 1) continue
        const name = rest.slice(0, slash)
        const list = groups.get(name) ?? []
        list.push({ path: rest.slice(slash + 1), text: entry.text })
        groups.set(name, list)
    }
    return groups
}

const textFileOf = (entries: ReadonlyArray<Entry>, name: string): string | null =>
    entries.find((entry) => entry.path === name)?.text ?? null

/** Collects findings while a converter runs. */
class Findings {
    readonly list: Array<HarnessIssue> = []

    add(path: string, code: string, message: string): void {
        this.list.push({ path: `${HARNESS_RAW_ROOT}${path}`, code, message })
    }
}

const sectionOf = (
    id: string,
    order: number,
    title: Localized,
    body: Localized,
    run: ReadonlyArray<string>,
): HarnessSectionRecord => ({ id, order, title, body, run })

/** Gives the sections of a guide written in the content standard their ids: the slug of the English title, made unique. */
const unanchoredOf = (
    sections: Record<HarnessLocale, ReadonlyArray<MarkdownSection>>,
): Record<HarnessLocale, ReadonlyArray<MarkdownSection>> => {
    const taken = new Map<string, number>()
    const ids = sections.en.map((section) => {
        const base = slugOf(section.title)
        const seen = taken.get(base) ?? 0
        taken.set(base, seen + 1)
        return seen === 0 ? base : `${base}-${String(seen + 1)}`
    })
    const withIds = (list: ReadonlyArray<MarkdownSection>): ReadonlyArray<MarkdownSection> =>
        list.map((section, index) => ({ ...section, id: ids[index] ?? section.id }))
    return {
        vi: sections.vi.length === sections.en.length ? withIds(sections.vi) : sections.vi,
        en: withIds(sections.en),
    }
}

/** Reads both locale files of a guide or a doc into sections; null when a file is missing or the two disagree. */
const bothSectionsOf = (
    folder: string,
    entries: ReadonlyArray<Entry>,
    findings: Findings,
): {
    readonly title: Localized
    readonly summary: Localized
    readonly order: number | null
    readonly minutes: number | null
    readonly probes: ReadonlyArray<string>
    readonly sections: ReadonlyArray<HarnessSectionRecord>
} | null => {
    const docs = HARNESS_LOCALES.map((locale) => {
        const text = textFileOf(entries, `${locale}.md`)
        if (text === null) findings.add(`${folder}/${locale}.md`, "HARNESS_FILE_MISSING", `${locale}.md is missing`)
        return text === null ? null : documentOf(text)
    })
    const [vi, en] = docs
    if (vi === null || vi === undefined || en === null || en === undefined) return null
    const anchored: Record<HarnessLocale, ReadonlyArray<MarkdownSection>> = {
        vi: sectionsOf(vi.body, 2),
        en: sectionsOf(en.body, 2),
    }
    const parsed =
        anchored.vi.length > 0 || anchored.en.length > 0
            ? anchored
            : unanchoredOf({ vi: titledSectionsOf(vi.body, 2), en: titledSectionsOf(en.body, 2) })
    const ids = parsed.vi.map((section) => section.id)
    if (ids.join("|") !== parsed.en.map((section) => section.id).join("|") || new Set(ids).size !== ids.length) {
        findings.add(
            folder,
            "HARNESS_LOCALE_MISMATCH",
            "vi.md and en.md must declare the same unique section ids in the same order",
        )
        return null
    }
    const titleOf = (doc: typeof vi): string =>
        textOf(doc.meta["title"]) ?? firstTitleOf(doc.body) ?? folder.split("/").pop() ?? folder
    const summaryOf = (doc: typeof vi): string => textOf(doc.meta["summary"]) ?? ""
    const order = vi.meta["order"]
    return {
        title: { vi: titleOf(vi), en: titleOf(en) },
        summary: { vi: summaryOf(vi), en: summaryOf(en) },
        order: typeof order === "number" && Number.isFinite(order) ? order : null,
        minutes: typeof vi.meta["minutes"] === "number" ? vi.meta["minutes"] : null,
        probes: stringsOf(vi.meta["probes"]) ?? [],
        sections: parsed.vi.map((section, index) =>
            sectionOf(
                section.id,
                index + 1,
                { vi: section.title, en: parsed.en[index]?.title ?? section.title },
                { vi: section.body, en: parsed.en[index]?.body ?? section.body },
                runBlocksOf(section.body),
            ),
        ),
    }
}

const guideOf = (
    tool: HarnessTool,
    slug: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
    folder: string,
): HarnessGuideRecord | null => {
    const read = bothSectionsOf(`guides/${folder}/${slug}`, entries, findings)
    if (read === null) return null
    return {
        tool,
        slug,
        order: read.order ?? index + 1,
        title: read.title,
        summary: read.summary,
        minutes: read.minutes,
        probes: read.probes,
        sections: read.sections,
        contentHash: filesHashOf(entries),
    }
}

const docOf = (
    slug: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessDocRecord | null => {
    const read = bothSectionsOf(`docs/${slug}`, entries, findings)
    if (read === null) return null
    return {
        slug,
        order: read.order ?? index + 1,
        title: read.title,
        summary: read.summary,
        minutes: read.minutes,
        sections: read.sections,
        contentHash: filesHashOf(entries),
    }
}

const keyNeedsOf = (value: unknown, path: string, findings: Findings): ReadonlyArray<HarnessKeyNeed> => {
    if (value === undefined) return []
    if (!Array.isArray(value)) {
        findings.add(path, "HARNESS_BUILD_INVALID", "keys must be a list")
        return []
    }
    return value.flatMap((item): Array<HarnessKeyNeed> => {
        const id = isRecord(item) ? textOf(item["id"]) : null
        const anyOf = isRecord(item) ? stringsOf(item["anyOf"]) : null
        if (id === null || !HARNESS_ID.test(id) || anyOf === null || anyOf.length === 0) {
            findings.add(path, "HARNESS_BUILD_INVALID", "a key need needs an id and a non-empty anyOf list of names")
            return []
        }
        return [{ id, anyOf, note: isRecord(item) ? localizedOf(item["note"]) : null }]
    })
}

/** The stage chapters and steps of one locale's build guide, by stage id. */
const chaptersOf = (
    text: string,
): ReadonlyArray<{ readonly id: string; readonly title: string; readonly steps: ReadonlyArray<MarkdownSection> }> =>
    sectionsOf(documentOf(text).body, 2).map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        steps: sectionsOf(chapter.body, 3),
    }))

const buildOf = (
    id: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessBuildRecord | null => {
    const base = `build/${id}`
    const stagesText = textFileOf(entries, "stages.yaml")
    if (stagesText === null) {
        findings.add(`${base}/stages.yaml`, "HARNESS_FILE_MISSING", "stages.yaml is missing")
        return null
    }
    const raw = yamlOf(stagesText)
    if (!isRecord(raw) || raw["id"] !== id) {
        findings.add(
            `${base}/stages.yaml`,
            "HARNESS_BUILD_INVALID",
            "stages.yaml must be a map whose id equals the folder name",
        )
        return null
    }
    const title = localizedOf(raw["title"])
    const summary = localizedOf(raw["summary"])
    const runtimeRaw = raw["runtime"]
    const stagesRaw = raw["stages"]
    if (
        title === null ||
        summary === null ||
        !isRecord(runtimeRaw) ||
        !Array.isArray(stagesRaw) ||
        stagesRaw.length === 0
    ) {
        findings.add(
            `${base}/stages.yaml`,
            "HARNESS_BUILD_INVALID",
            "title, summary, runtime and a non-empty stages list are required",
        )
        return null
    }
    const runtime = {
        dir: textOf(runtimeRaw["dir"]) ?? "source",
        install: textOf(runtimeRaw["install"]) ?? "npm ci",
        e2e: textOf(runtimeRaw["e2e"]) ?? "npm run e2e",
        report: textOf(runtimeRaw["report"]) ?? "e2e/reports/junit.xml",
    }
    const chapters = HARNESS_LOCALES.map((locale) => {
        const text = textFileOf(entries, `${locale}.md`)
        if (text === null) findings.add(`${base}/${locale}.md`, "HARNESS_FILE_MISSING", `${locale}.md is missing`)
        return text === null ? null : chaptersOf(text)
    })
    const [vi, en] = chapters
    if (vi === null || vi === undefined || en === null || en === undefined) return null
    const shape = (list: typeof vi): string =>
        list.map((chapter) => `${chapter.id}:${chapter.steps.map((step) => step.id).join(",")}`).join("|")
    if (shape(vi) !== shape(en)) {
        findings.add(
            base,
            "HARNESS_LOCALE_MISMATCH",
            "vi.md and en.md must declare the same stage and step ids in the same order",
        )
        return null
    }
    const seenE2e = new Set<string>()
    const stages: Array<HarnessStageRecord> = []
    for (const [position, stage] of stagesRaw.entries()) {
        const stageId = isRecord(stage) ? textOf(stage["id"]) : null
        const e2e = isRecord(stage) ? stringsOf(stage["e2e"]) : null
        const stageTitle = isRecord(stage) ? localizedOf(stage["title"]) : null
        const stageSummary = isRecord(stage) ? localizedOf(stage["summary"]) : null
        const chapterVi = vi.find((chapter) => chapter.id === stageId)
        const chapterEn = en.find((chapter) => chapter.id === stageId)
        if (
            stageId === null ||
            !HARNESS_ID.test(stageId) ||
            e2e === null ||
            e2e.length === 0 ||
            stageTitle === null ||
            stageSummary === null
        ) {
            findings.add(
                `${base}/stages.yaml`,
                "HARNESS_BUILD_INVALID",
                `stage ${String(position + 1)} needs an id, a title, a summary and e2e ids`,
            )
            continue
        }
        if (chapterVi === undefined || chapterEn === undefined) {
            findings.add(`${base}/vi.md`, "HARNESS_STAGE_UNGUIDED", `stage ${stageId} has no chapter in the guide`)
            continue
        }
        const badE2e = e2e.filter((each) => !HARNESS_ID.test(each) || seenE2e.has(each))
        if (badE2e.length > 0)
            findings.add(
                `${base}/stages.yaml`,
                "HARNESS_BUILD_INVALID",
                `e2e ids must be unique slugs: ${badE2e.join(", ")}`,
            )
        e2e.forEach((each) => seenE2e.add(each))
        const steps: Array<HarnessStepRecord> = chapterVi.steps.map((step, stepIndex) => {
            const other = chapterEn.steps[stepIndex]
            return {
                id: step.id,
                order: stepIndex + 1,
                title: { vi: step.title, en: other?.title ?? step.title },
                body: { vi: step.body, en: other?.body ?? step.body },
                run: runBlocksOf(step.body),
            }
        })
        stages.push({ id: stageId, order: position + 1, title: stageTitle, summary: stageSummary, e2e, steps })
    }
    if (new Set(stages.map((stage) => stage.id)).size !== stages.length) {
        findings.add(`${base}/stages.yaml`, "HARNESS_BUILD_INVALID", "stage ids must be unique")
        return null
    }
    const live = entries.filter((entry) => !isSkipped(entry.path))
    const order = raw["order"]
    return {
        id,
        order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
        title,
        summary,
        keys: keyNeedsOf(raw["keys"], `${base}/stages.yaml`, findings),
        runtime,
        stages,
        packFiles: live
            .filter((entry) => entry.path.startsWith("source/") || entry.path.startsWith("e2e/"))
            .map((entry) => ({ path: entry.path, text: entry.text }))
            .sort((a, b) => a.path.localeCompare(b.path)),
        hiddenPaths: live
            .filter((entry) => entry.path.startsWith("hidden/"))
            .map((entry) => entry.path)
            .sort(),
        contentHash: filesHashOf(live),
    }
}

/** The tool a content folder holds: `claude-code` and `claude` hold the Claude Code track, `codex` the Codex track. */
const TOOL_FOLDERS: Readonly<Record<string, HarnessTool>> = {
    "claude-code": "claude",
    claude: "claude",
    codex: "codex",
}

const toolOfFolder = (folder: string): HarnessTool | null => TOOL_FOLDERS[folder] ?? null

const probesOf = (
    tool: HarnessTool,
    folder: string,
    entries: ReadonlyArray<Entry>,
    findings: Findings,
): Array<HarnessProbeRecord> => {
    const files = entries
        .filter((entry) => !entry.path.includes("/") && entry.path.endsWith(".yaml"))
        .sort((a, b) => a.path.localeCompare(b.path))
    const probes: Array<HarnessProbeRecord> = []
    for (const [index, file] of files.entries()) {
        const path = `doctor/${folder}/${file.path}`
        const raw = yamlOf(file.text)
        const id = isRecord(raw) ? (textOf(raw["id"]) ?? file.path.replace(/\.yaml$/u, "")) : null
        const title = isRecord(raw) ? localizedOf(raw["title"]) : null
        const fix = isRecord(raw) ? localizedOf(raw["fix"]) : null
        if (
            !isRecord(raw) ||
            id === null ||
            !HARNESS_ID.test(id) ||
            title === null ||
            fix === null ||
            !isRecord(raw["check"])
        ) {
            findings.add(
                path,
                "HARNESS_PROBE_INVALID",
                "a probe is a yaml map with a kebab-case id, a title, a fix and one check",
            )
            continue
        }
        if (toolOfFolder(textOf(raw["tool"]) ?? "") !== tool) {
            findings.add(path, "HARNESS_PROBE_INVALID", `the probe tool must be ${tool}, the tool of its folder`)
            continue
        }
        if (probes.some((probe) => probe.id === id)) {
            findings.add(path, "HARNESS_PROBE_INVALID", `probe id ${id} is used twice for ${tool}`)
            continue
        }
        const order = raw["order"]
        probes.push({
            id,
            tool,
            order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
            title,
            guide: textOf(raw["guide"]),
            fix,
            yaml: file.text,
        })
    }
    return probes
}

/** True when a path matches a glob of `**`, `*` and literal characters. */
export const globMatches = (glob: string, path: string): boolean => {
    const source = glob
        .split("**")
        .map((part) =>
            part
                .split("*")
                .map((literal) => literal.replace(/[.+?^${}()|[\]\\]/gu, "\\$&"))
                .join("[^/]*"),
        )
        .join(".*")
    return new RegExp(`^${source}$`, "u").test(path)
}

const budgetOf = (value: unknown): HarnessBudget | null => {
    if (!isRecord(value)) return null
    const { maxUsd, maxTurns, timeoutSec } = value
    return typeof maxUsd === "number" && typeof maxTurns === "number" && typeof timeoutSec === "number"
        ? { maxUsd, maxTurns, timeoutSec }
        : null
}

const shortcutsOf = (value: unknown): ReadonlyArray<HarnessShortcut> | null => {
    if (!Array.isArray(value) || value.length === 0) return null
    const found = value.flatMap((item: unknown): Array<HarnessShortcut> => {
        const id = isRecord(item) ? textOf(item["id"]) : null
        const title = isRecord(item) ? localizedOf(item["title"]) : null
        return id === null || title === null ? [] : [{ id, title }]
    })
    return found.length === value.length ? found : null
}

const trapOf = (
    id: string,
    entries: ReadonlyArray<Entry>,
    index: number,
    findings: Findings,
): HarnessTrapRecord | null => {
    const base = `trials/${id}`
    const text = textFileOf(entries, "trap.yaml")
    if (text === null) {
        findings.add(`${base}/trap.yaml`, "HARNESS_FILE_MISSING", "trap.yaml is missing")
        return null
    }
    const raw = yamlOf(text)
    const title = isRecord(raw) ? localizedOf(raw["title"]) : null
    const brief = isRecord(raw) ? localizedOf(raw["brief"]) : null
    const prompt = isRecord(raw) ? textOf(raw["prompt"]) : null
    const budget = isRecord(raw) ? budgetOf(raw["budget"]) : null
    const shortcuts = isRecord(raw) ? shortcutsOf(raw["shortcuts"]) : null
    const verify = isRecord(raw) && isRecord(raw["verify"]) ? raw["verify"] : null
    if (
        !isRecord(raw) ||
        raw["id"] !== id ||
        title === null ||
        brief === null ||
        prompt === null ||
        budget === null ||
        shortcuts === null ||
        verify === null ||
        textOf(verify["command"]) === null
    ) {
        findings.add(
            `${base}/trap.yaml`,
            "HARNESS_TRAP_INVALID",
            "a trap needs id (the folder name), title, brief, prompt, budget, shortcuts and verify.command",
        )
        return null
    }
    const tools = (stringsOf(raw["tools"]) ?? []).flatMap((tool) => toolOfFolder(tool) ?? [])
    const files: Array<HarnessFile> = entries
        .filter((entry) => !isSkipped(entry.path))
        .map((entry) => ({ path: entry.path, text: entry.text }))
        .sort((a, b) => a.path.localeCompare(b.path))
    const order = raw["order"]
    return {
        id,
        order: typeof order === "number" && Number.isFinite(order) ? order : index + 1,
        title,
        brief,
        prompt,
        tools: tools.length === 0 ? [...HARNESS_TOOLS] : tools,
        budget,
        shortcuts,
        files,
        contentHash: filesHashOf(files),
    }
}

/** The folders of one kind under `prefix`, each with the tool it holds; a folder that holds none is a finding. */
const toolGroupsOf = (
    entries: ReadonlyArray<Entry>,
    prefix: string,
    findings: Findings,
): ReadonlyArray<{ readonly tool: HarnessTool; readonly folder: string; readonly group: Array<Entry> }> =>
    [...groupedBy(entries, prefix)].flatMap(([folder, group]) => {
        const tool = toolOfFolder(folder)
        if (tool === null) {
            findings.add(
                `${prefix}/${folder}`,
                "HARNESS_TOOL_UNKNOWN",
                `${folder} is not a tool folder (claude-code, claude or codex)`,
            )
            return []
        }
        return [{ tool, folder, group }]
    })

/**
 * Converts the `raw/harness/**` files of the content tree to the records the app stores (CONTRACT.md): builds (stages.yaml, the two
 * guides, `source/`, `e2e/`, `hidden/`), guides and docs (the content standard with separator fields, or front matter with anchored
 * sections), doctor probes with their packs, and trial traps. It is pure: files in, records and findings out; the importer and the
 * seed adapter both call it, and any finding refuses the import.
 */
export const convertRawHarness = (files: ReadonlyArray<HarnessRawFile>): HarnessConverted => {
    const findings = new Findings()
    const entries: Array<Entry> = files
        .filter((file) => file.path.startsWith(HARNESS_RAW_ROOT))
        .map((file) => ({ path: file.path.slice(HARNESS_RAW_ROOT.length), text: file.text }))
    const builds = [...groupedBy(entries, "build")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([id, group], index) => {
            const build = buildOf(id, group, index, findings)
            return build === null ? [] : [build]
        })
    const probes: Array<HarnessProbeRecord> = []
    const doctorPacks: Array<HarnessDoctorPackRecord> = []
    for (const { tool, folder, group } of toolGroupsOf(entries, "doctor", findings)) {
        probes.push(...probesOf(tool, folder, group, findings))
        const packed = group
            .filter((entry) => !isSkipped(entry.path))
            .map((entry) => ({ path: `doctor/${folder}/${entry.path}`, text: entry.text }))
            .sort((a, b) => a.path.localeCompare(b.path))
        if (packed.length > 0) doctorPacks.push({ tool, files: packed, contentHash: filesHashOf(packed) })
    }
    const guides: Array<HarnessGuideRecord> = []
    for (const { tool, folder } of toolGroupsOf(entries, "guides", findings)) {
        ;[...groupedBy(entries, `guides/${folder}`)]
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([slug, group], index) => {
                const guide = HARNESS_ID.test(slug) ? guideOf(tool, slug, group, index, findings, folder) : null
                if (guide !== null) guides.push(guide)
            })
    }
    const linked = guides.map((guide) => ({
        ...guide,
        probes: [
            ...new Set([
                ...guide.probes,
                ...probes
                    .filter((probe) => probe.tool === guide.tool && probe.guide === guide.slug)
                    .map((probe) => probe.id),
            ]),
        ],
    }))
    for (const guide of linked) {
        const known = new Set(probes.filter((probe) => probe.tool === guide.tool).map((probe) => probe.id))
        const missing = guide.probes.filter((probe) => !known.has(probe))
        if (missing.length > 0) {
            findings.add(
                `guides/${guide.tool}/${guide.slug}`,
                "HARNESS_PROBE_UNKNOWN",
                `unknown probe ids: ${missing.join(", ")}`,
            )
        }
    }
    const docs = [...groupedBy(entries, "docs")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([slug, group], index) => {
            const doc = HARNESS_ID.test(slug) ? docOf(slug, group, index, findings) : null
            return doc === null ? [] : [doc]
        })
    const traps = [...groupedBy(entries, "trials")]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([id, group], index) => {
            const trap = trapOf(id, group, index, findings)
            return trap === null ? [] : [trap]
        })
    // A probe that names a guide not written yet keeps no link instead of refusing the import: the guide may land in a later commit.
    const linkedProbes = probes.map((probe) =>
        probe.guide !== null && !linked.some((guide) => guide.tool === probe.tool && guide.slug === probe.guide)
            ? { ...probe, guide: null }
            : probe,
    )
    return { builds, guides: linked, docs, probes: linkedProbes, doctorPacks, traps, issues: findings.list }
}

/** Whether any file of the list belongs to the harness raw tree. */
export const hasRawHarness = (files: ReadonlyArray<HarnessRawFile>): boolean =>
    files.some((file) => file.path.startsWith(HARNESS_RAW_ROOT))
