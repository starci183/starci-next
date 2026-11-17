import { isRecord } from "@modules/platform/primitives"
import { HARNESS_TOOLS } from "./harness.contracts"
import type {
    HarnessBuildRecord,
    HarnessBuildView,
    HarnessDocRecord,
    HarnessDocView,
    HarnessE2eView,
    HarnessGuideRecord,
    HarnessGuideView,
    HarnessLocale,
    HarnessPartKey,
    HarnessPartView,
    HarnessProbeRecord,
    HarnessProbeResultView,
    HarnessProbeStatus,
    HarnessProofRow,
    HarnessProofState,
    HarnessRunRow,
    HarnessSectionRecord,
    HarnessShortcutView,
    HarnessStageRecord,
    HarnessStageView,
    HarnessTool,
    HarnessTrapView,
    HarnessTrapRecord,
    HarnessTrialResultView,
    HarnessTextView,
} from "./harness.contracts"

/** The task id the relay stores the results of one build under. */
export const harnessBuildTaskOf = (buildId: string): string => `harness:build:${buildId}`

/** The task prefix of every build. */
export const HARNESS_BUILD_TASK_PREFIX = "harness:build:"

/** The task id doctor results are stored under. */
export const HARNESS_DOCTOR_TASK = "harness:doctor"

/** The task id trial results are stored under. */
export const HARNESS_TRIAL_TASK = "harness:trial"

/** The relay slots of the harness results. */
export const HARNESS_SLOTS = { stage: "harness-stage", doctor: "harness-doctor", trial: "harness-trial" } as const

/** A stored build as the database holds it: the record without the pack text, with the pack paths. */
export type StoredBuild = Omit<HarnessBuildRecord, "packFiles" | "hiddenPaths" | "contentHash"> & {
    readonly packPaths: ReadonlyArray<string>
}

/** A stored trap: the record without its files. */
export type StoredTrap = Omit<HarnessTrapRecord, "files" | "contentHash"> & { readonly paths: ReadonlyArray<string> }

/** The state two states of equal weight reduce to: all proved is proved, any progress is practising. */
export const rolledState = (states: ReadonlyArray<HarnessProofState>): HarnessProofState => {
    if (states.length > 0 && states.every((state) => state === "proved")) return "proved"
    return states.some((state) => state !== "none") ? "practising" : "none"
}

const keyOf = (stageId: string, e2eId: string): string => `${stageId}\u0000${e2eId}`

const stageViewOf = (
    stage: HarnessStageRecord,
    locale: HarnessLocale,
    runs: ReadonlyMap<string, HarnessRunRow>,
    proofs: ReadonlyMap<string, HarnessProofRow>,
): HarnessStageView => {
    const e2e: Array<HarnessE2eView> = stage.e2e.map((id) => {
        const run = runs.get(keyOf(stage.id, id))
        const proof = proofs.get(keyOf(stage.id, id))
        const proved = proof?.passed === true
        const state: HarnessProofState = proved ? "proved" : run?.passed === true ? "practising" : "none"
        const newest = proved ? proof : run
        return {
            id,
            state,
            passed: newest === undefined ? null : newest.passed,
            commit: newest?.commit ?? null,
            at: newest?.at ?? null,
        }
    })
    const stageRuns = stage.e2e.flatMap((id) => runs.get(keyOf(stage.id, id)) ?? [])
    const newest = [...stageRuns].sort((a, b) => b.at.localeCompare(a.at))[0]
    const failing = [...stageRuns]
        .filter((run) => !run.passed && run.why !== null)
        .sort((a, b) => b.at.localeCompare(a.at))[0]
    return {
        id: stage.id,
        order: stage.order,
        title: stage.title[locale],
        summary: stage.summary[locale],
        state: rolledState(e2e.map((each) => each.state)),
        e2e,
        steps: stage.steps.map((step) => ({
            id: step.id,
            order: step.order,
            title: step.title[locale],
            body: step.body[locale],
            run: step.run,
        })),
        lastRunAt: newest?.at ?? null,
        lastWhy: failing?.why ?? null,
    }
}

/**
 * One build in one locale with the learner's progress: an e2e is proved by an attested CI result that passed, practising by the
 * newest relayed result that passed, else none. A stage is proved when every e2e is, practising when any has progress; a build
 * follows its stages. Proof is never lowered by a later red relayed run.
 */
export const buildViewOf = (
    build: StoredBuild,
    locale: HarnessLocale,
    runRows: ReadonlyArray<HarnessRunRow>,
    proofRows: ReadonlyArray<HarnessProofRow>,
    binding: { readonly repository: string; readonly bindingId: string } | null,
    audience: string,
): HarnessBuildView => {
    const runs = new Map(
        runRows.filter((row) => row.ref !== null).map((row) => [keyOf(row.checkId, row.ref ?? ""), row] as const),
    )
    const proofs = new Map(
        proofRows.filter((row) => row.buildId === build.id).map((row) => [keyOf(row.stageId, row.e2eId), row] as const),
    )
    const stages = build.stages.map((stage) => stageViewOf(stage, locale, runs, proofs))
    return {
        id: build.id,
        order: build.order,
        title: build.title[locale],
        summary: build.summary[locale],
        keys: build.keys.map((key) => ({ id: key.id, anyOf: key.anyOf, note: key.note?.[locale] ?? null })),
        stageCount: stages.length,
        practisingStages: stages.filter((stage) => stage.state !== "none").length,
        provedStages: stages.filter((stage) => stage.state === "proved").length,
        state: rolledState(stages.map((stage) => stage.state)),
        runtime: build.runtime,
        repository: {
            bound: binding !== null,
            repository: binding?.repository ?? null,
            bindingId: binding?.bindingId ?? null,
            audience,
        },
        stages,
    }
}

const textOf = (section: HarnessSectionRecord, locale: HarnessLocale): HarnessTextView => ({
    id: section.id,
    order: section.order,
    title: section.title[locale],
    body: section.body[locale],
    run: section.run,
})

/** The newest relayed result of each check of a task, keyed by `<check>` and ref when the ref is given. */
const rowFor = (rows: ReadonlyArray<HarnessRunRow>, checkId: string, ref: string | null): HarnessRunRow | undefined =>
    rows
        .filter((row) => row.checkId === checkId && (ref === null || row.ref === ref))
        .sort((a, b) => b.at.localeCompare(a.at))[0]

const STATUSES: ReadonlyArray<HarnessProbeStatus> = ["passed", "failed", "skipped", "invalid"]

const detailText = (row: HarnessRunRow | undefined, key: string): string | null => {
    const value = row?.detail?.[key]
    return typeof value === "string" ? value : null
}

/** One doctor probe with the learner's newest uploaded result for the tool, or `not-run`. */
export const probeResultOf = (
    probe: HarnessProbeRecord,
    guide: string | null,
    locale: HarnessLocale,
    rows: ReadonlyArray<HarnessRunRow>,
): HarnessProbeResultView => {
    const row = rowFor(rows, probe.id, probe.tool)
    const stated = detailText(row, "status")
    const status: HarnessProbeStatus =
        row === undefined ? "not-run" : (STATUSES.find((each) => each === stated) ?? (row.passed ? "passed" : "failed"))
    const reason = detailText(row, "reason") ?? row?.why ?? null
    return {
        id: probe.id,
        order: probe.order,
        title: probe.title[locale],
        guide,
        fix: probe.fix[locale],
        status,
        reason: status === "passed" ? null : reason,
        at: row?.at ?? null,
    }
}

/** The guide slug of each probe: the guide whose front matter lists it. */
export const guideOfProbeMap = (guides: ReadonlyArray<HarnessGuideRecord>): ReadonlyMap<string, string> =>
    new Map(guides.flatMap((guide) => guide.probes.map((probe) => [`${guide.tool}/${probe}`, guide.slug] as const)))

/** One guide in one locale with the probes that check it. */
export const guideViewOf = (
    guide: HarnessGuideRecord,
    probes: ReadonlyArray<HarnessProbeRecord>,
    locale: HarnessLocale,
    rows: ReadonlyArray<HarnessRunRow>,
): HarnessGuideView => ({
    tool: guide.tool,
    slug: guide.slug,
    order: guide.order,
    title: guide.title[locale],
    summary: guide.summary[locale],
    minutes: guide.minutes,
    sections: guide.sections.map((section) => textOf(section, locale)),
    probes: probes
        .filter((probe) => guide.probes.includes(probe.id))
        .map((probe) => probeResultOf(probe, guide.slug, locale, rows)),
})

/** One doc in one locale. */
export const docViewOf = (doc: HarnessDocRecord, locale: HarnessLocale): HarnessDocView => ({
    slug: doc.slug,
    order: doc.order,
    title: doc.title[locale],
    summary: doc.summary[locale],
    minutes: doc.minutes,
    sections: doc.sections.map((section) => textOf(section, locale)),
})

const shortcutsOf = (
    value: unknown,
    known: ReadonlyArray<{ readonly id: string; readonly title: { readonly vi: string; readonly en: string } }>,
    locale: HarnessLocale,
): ReadonlyArray<HarnessShortcutView> =>
    Array.isArray(value)
        ? value.flatMap((item): Array<HarnessShortcutView> =>
              isRecord(item) && typeof item["kind"] === "string"
                  ? [
                        {
                            kind: item["kind"],
                            title: known.find((each) => each.id === item["kind"])?.title[locale] ?? null,
                            blocked: item["blocked"] === true,
                        },
                    ]
                  : [],
          )
        : []

/** The newest trial result of a trap for one tool (or any tool when none is named), or null. */
export const trialResultOf = (
    trap: Pick<StoredTrap, "id" | "shortcuts">,
    tool: HarnessTool | null,
    rows: ReadonlyArray<HarnessRunRow>,
    locale: HarnessLocale,
): HarnessTrialResultView | null => {
    const row = rows
        .filter((each) => each.checkId === trap.id && (tool === null || each.ref === tool))
        .sort((a, b) => b.at.localeCompare(a.at))[0]
    const known = HARNESS_TOOLS.find((each) => each === row?.ref)
    if (row === undefined || known === undefined) return null
    return {
        tool: known,
        verdict: detailText(row, "verdict") ?? (row.passed ? "held" : "breached"),
        testsGreen: row.detail?.["testsGreen"] === true,
        shortcuts: shortcutsOf(row.detail?.["shortcuts"], trap.shortcuts, locale),
        at: row.at,
    }
}

/** One trap in one locale with the learner's newest result. */
export const trapViewOf = (
    trap: StoredTrap,
    locale: HarnessLocale,
    tool: HarnessTool | null,
    rows: ReadonlyArray<HarnessRunRow>,
): HarnessTrapView => ({
    id: trap.id,
    order: trap.order,
    title: trap.title[locale],
    brief: trap.brief[locale],
    prompt: trap.prompt,
    tools: trap.tools,
    budget: trap.budget,
    shortcuts: trap.shortcuts.map((shortcut) => ({ id: shortcut.id, title: shortcut.title[locale] })),
    last: trialResultOf(trap, tool, rows, locale),
})

/** Inputs of the hub of /harness. */
export interface HubInput {
    /** The stored builds. */
    readonly builds: ReadonlyArray<HarnessBuildView>
    /** The guides. */
    readonly guides: ReadonlyArray<HarnessGuideRecord>
    /** The probes. */
    readonly probes: ReadonlyArray<HarnessProbeRecord>
    /** The doctor rows of the learner. */
    readonly doctorRows: ReadonlyArray<HarnessRunRow>
    /** The docs. */
    readonly docs: ReadonlyArray<HarnessDocRecord>
    /** The words of the parts. */
    readonly words: (key: string) => string
}

const part = (
    key: HarnessPartKey,
    order: number,
    words: HubInput["words"],
    counts: Pick<HarnessPartView, "total" | "practising" | "proved" | "done" | "nextId">,
): HarnessPartView => ({
    key,
    order,
    title: words(`part.${key}.title`),
    summary: words(`part.${key}.summary`),
    ...counts,
})

/**
 * The three parts of the hub. Build counts builds by their state (done is proved). Use counts the probes of both tools: a
 * passed probe is done, and the next guide is the first with a probe that is not passed. Docs only counts the docs (read-only).
 */
export const hubOf = (input: HubInput): ReadonlyArray<HarnessPartView> => {
    const passedProbe = (probe: HarnessProbeRecord): boolean =>
        rowFor(input.doctorRows, probe.id, probe.tool)?.passed === true
    const passed = input.probes.filter(passedProbe).length
    const nextGuide = input.guides.find((guide) =>
        input.probes.some(
            (probe) => probe.tool === guide.tool && guide.probes.includes(probe.id) && !passedProbe(probe),
        ),
    )
    const nextBuild = input.builds.find((build) => build.state !== "proved")
    const proved = input.builds.filter((build) => build.state === "proved").length
    return [
        part("build", 1, input.words, {
            total: input.builds.length,
            practising: input.builds.filter((build) => build.state === "practising").length,
            proved,
            done: proved,
            nextId: nextBuild?.id ?? null,
        }),
        part("use", 2, input.words, {
            total: input.probes.length,
            practising: passed,
            proved: 0,
            done: passed,
            nextId: nextGuide === undefined ? null : `${nextGuide.tool}/${nextGuide.slug}`,
        }),
        part("docs", 3, input.words, {
            total: input.docs.length,
            practising: 0,
            proved: 0,
            done: 0,
            nextId: input.docs[0]?.slug ?? null,
        }),
    ]
}
