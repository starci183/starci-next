import type {
    HarnessBuildQuery,
    HarnessBuildsQuery,
    HarnessDocQuery,
    HarnessDocsQuery,
    HarnessDoctorQuery,
    HarnessGuideQuery,
    HarnessGuidesQuery,
    HarnessHubQuery,
    HarnessTrialsQuery,
} from "@/modules/api/graphql/__generated__/graphql"
import {
    HARNESS_PARTS,
    type HarnessBuildRowView,
    type HarnessBuildView,
    type HarnessDocRowView,
    type HarnessDocView,
    type HarnessDoctorView,
    type HarnessE2eCaseView,
    type HarnessGuideRowView,
    type HarnessGuideView,
    type HarnessHubPartView,
    type HarnessProbeView,
    type HarnessSectionView,
    type HarnessStageView,
    type HarnessTool,
    type HarnessTrialView,
    type HarnessVerdict,
} from "@/modules/types"

/** The CLI line that runs the doctor of one tool on the learner machine. */
export const doctorCommandOf = (tool: HarnessTool): string => `npx @starci/next harness doctor --tool ${tool}`

/** The CLI line that pulls the starter source of a build. */
export const pullCommandOf = (buildId: string): string => `npx @starci/next harness pull ${buildId}`

/** The CLI line that runs the trial of one trap with one tool. */
export const trialCommandOf = (trap: string, tool: HarnessTool): string =>
    `npx @starci/next harness trial ${trap} --tool ${tool}`

/** The three backticks of a markdown code fence. */
const FENCE = "```"

/** The newest of several ISO times; empty when there are none. */
const newestOf = (times: ReadonlyArray<string | null | undefined>): string =>
    times.reduce<string>((newest, time) => (time !== null && time !== undefined && time > newest ? time : newest), "")

/** One text of the back end (a step or a section): its body, then each copy-run script as a bash block. */
const textOf = (text: {
    readonly id: string
    readonly title: string
    readonly body: string
    readonly run: ReadonlyArray<string>
}): HarnessSectionView => ({
    id: text.id,
    title: text.title,
    markdown: [text.body, ...text.run.map((script) => `${FENCE}bash\n${script.trim()}\n${FENCE}`)]
        .filter((part) => part.trim() !== "")
        .join("\n\n"),
})

/** The tool a back end string names. */
const toolOf = (raw: string): HarnessTool => (raw === "codex" ? "codex" : "claude")

/** The parts of the hub, in the order the back end gives them. */
export const hubPartsOf = (hub: HarnessHubQuery["harnessHub"]): ReadonlyArray<HarnessHubPartView> =>
    hub.parts.flatMap((part) => {
        const key = HARNESS_PARTS.find((each) => each.toUpperCase() === part.key)
        return key === undefined
            ? []
            : [
                  {
                      key,
                      title: part.title,
                      summary: part.summary,
                      total: part.total,
                      practising: part.practising,
                      proved: part.proved,
                      done: part.done,
                  },
              ]
    })

/** The environment names a build asks for, one text per need. */
const keysOf = (keys: HarnessBuildsQuery["harnessBuilds"][number]["keys"]): ReadonlyArray<string> =>
    keys.map((need) => need.anyOf.join(" / "))

/** The rows of the builds of part 1. */
export const buildRowsOf = (builds: HarnessBuildsQuery["harnessBuilds"]): ReadonlyArray<HarnessBuildRowView> =>
    builds.map((build) => ({
        id: build.id,
        title: build.title,
        summary: build.summary,
        keys: keysOf(build.keys),
        stageCount: build.stageCount,
        practisingStages: build.practisingStages,
        provedStages: build.provedStages,
    }))

/** One e2e test from its newest result: green, red, or never run. */
const caseOf = (
    why: string,
    each: HarnessBuildQuery["harnessBuild"]["stages"][number]["e2e"][number],
): HarnessE2eCaseView => ({
    id: each.id,
    title: each.id,
    outcome: each.passed === null ? "untested" : each.passed ? "green" : "red",
    detail: each.passed === false ? why : "",
})

/** One stage with its e2e cases and steps. */
const stageOf = (stage: HarnessBuildQuery["harnessBuild"]["stages"][number], isLocked: boolean): HarnessStageView => {
    const cases = stage.e2e.map((each) => caseOf(stage.lastWhy ?? "", each))
    const passed = cases.filter((each) => each.outcome === "green").length
    const hasRed = cases.some((each) => each.outcome === "red")
    return {
        id: stage.id,
        title: stage.title,
        summary: stage.summary,
        passed,
        total: cases.length,
        outcome: cases.length > 0 && passed === cases.length ? "green" : hasRed ? "red" : "untested",
        isLocked,
        proof: stage.state === "PROVED" || stage.state === "PRACTISING" ? stage.state : "NONE",
        cases,
        steps: stage.steps.map(textOf),
    }
}

/** One build with its stages; a stage is locked while the stage before it is locked or not green, and the first is always open. */
export const buildOf = (build: HarnessBuildQuery["harnessBuild"]): HarnessBuildView => {
    const stages: Array<HarnessStageView> = []
    build.stages.forEach((stage) => {
        const before = stages[stages.length - 1]
        stages.push(stageOf(stage, before !== undefined && (before.isLocked || before.outcome !== "green")))
    })
    return {
        id: build.id,
        title: build.title,
        summary: build.summary,
        keys: keysOf(build.keys),
        pullCommand: pullCommandOf(build.id),
        ranAt: newestOf(build.stages.map((stage) => stage.lastRunAt)),
        repository: {
            isBound: build.repository.bound,
            name: build.repository.repository ?? "",
            bindingId: build.repository.bindingId ?? "",
            audience: build.repository.audience,
        },
        stages,
    }
}

/** The guides of one tool as list rows. */
export const guideRowsOf = (guides: HarnessGuidesQuery["harnessGuides"]): ReadonlyArray<HarnessGuideRowView> =>
    guides.map((guide) => ({ slug: guide.slug, tool: toolOf(guide.tool), title: guide.title, summary: guide.summary }))

/** One probe from its newest result: failed and invalid count as failing, skipped and not run as skipped. */
export const probeOf = (probe: HarnessDoctorQuery["harnessDoctor"]["probes"][number]): HarnessProbeView => {
    const isFailing = probe.status === "FAILED" || probe.status === "INVALID"
    return {
        id: probe.id,
        title: probe.title,
        outcome: probe.status === "PASSED" ? "pass" : isFailing ? "fail" : "skipped",
        detail: isFailing ? (probe.reason ?? probe.fix ?? "") : "",
        guideSlug: probe.guide ?? "",
        at: probe.at ?? "",
    }
}

/** One guide with its sections and the probes that check it. */
export const guideOf = (guide: HarnessGuideQuery["harnessGuide"]): HarnessGuideView => ({
    slug: guide.slug,
    tool: toolOf(guide.tool),
    title: guide.title,
    summary: guide.summary,
    sections: guide.sections.map(textOf),
    probes: guide.probes.map(probeOf),
})

/** The articles of part 3 as list rows. */
export const docRowsOf = (docs: HarnessDocsQuery["harnessDocs"]): ReadonlyArray<HarnessDocRowView> =>
    docs.map((doc) => ({ slug: doc.slug, title: doc.title, summary: doc.summary }))

/** One article with its sections. */
export const docOf = (doc: HarnessDocQuery["harnessDoc"]): HarnessDocView => ({
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    sections: doc.sections.map(textOf),
})

/** The doctor of one tool with the newest result of every probe. */
export const doctorOf = (doctor: HarnessDoctorQuery["harnessDoctor"]): HarnessDoctorView => {
    const tool = toolOf(doctor.tool)
    return {
        tool,
        command: doctorCommandOf(tool),
        ranAt: newestOf(doctor.probes.map((probe) => probe.at)),
        probes: doctor.probes.map(probeOf),
    }
}

/** The verdict of a trial as the learner reads it. */
const verdictOf = (raw: string | undefined): HarnessVerdict => {
    if (raw === "held") return "clean"
    if (raw === "breached") return "shortcut"
    return raw === "incomplete" ? "incomplete" : "untested"
}

/** The traps of the trial panel for one tool, each with the newest result and its budget. */
export const trialsOf = (
    tool: HarnessTool,
    traps: HarnessTrialsQuery["harnessTrials"],
): ReadonlyArray<HarnessTrialView> =>
    traps.map((trap) => ({
        id: trap.id,
        tool,
        title: trap.title,
        summary: trap.brief,
        command: trialCommandOf(trap.id, tool),
        maxUsd: trap.budget.maxUsd,
        verdict: verdictOf(trap.last?.verdict),
        shortcuts: (trap.last?.shortcuts ?? []).map((each) => ({
            id: each.kind,
            label: each.kind,
            count: 1,
            isBlocked: each.blocked,
        })),
    }))
