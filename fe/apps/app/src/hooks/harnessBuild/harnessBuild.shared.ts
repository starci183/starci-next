import { harnessBuildPath } from "@/modules/routes"
import type {
    HarnessBuildView,
    HarnessE2eCaseView,
    HarnessE2eOutcome,
    HarnessStageView,
    HarnessStepView,
} from "@/modules/types"
import { OUTCOME_TONES, type HarnessCommonLabels } from "@/hooks/harness"

/** The tone of a badge, as the grammar names it. */
export type HarnessTone = "success" | "danger" | "muted" | "accent"

/** One stage in the list beside the stage on screen. */
export type HarnessStageItemView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly count: string
    readonly outcome: string
    readonly tone: HarnessTone
    readonly isSelected: boolean
    readonly href: string
}

/** One e2e case of the stage on screen. */
export type HarnessCaseItemView = {
    readonly id: string
    readonly title: string
    readonly outcome: string
    readonly tone: HarnessTone
    readonly isOpen: boolean
    readonly detail: string
}

/** The stage on screen: its cases, the log of its newest run and the step guide that gets it green. */
export type HarnessSelectedStageView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly position: string
    readonly count: string
    readonly outcome: string
    readonly tone: HarnessTone
    readonly isLocked: boolean
    readonly cases: ReadonlyArray<HarnessCaseItemView>
    readonly log: ReadonlyArray<string>
    readonly steps: ReadonlyArray<HarnessStepView>
}

/** The build as drawn. */
export type HarnessBuildScreenView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly keys: string
    readonly repository: { readonly isBound: boolean; readonly name: string; readonly audience: string }
    readonly pullCommand: string
    readonly ranAt: string
    readonly stages: ReadonlyArray<HarnessStageItemView>
    readonly selected: HarnessSelectedStageView
}

/** The words the builder of the build view needs, resolved by the hook. */
export type HarnessBuildWords = {
    readonly common: HarnessCommonLabels
    readonly count: (passed: number, total: number) => string
    readonly position: (n: number, total: number) => string
    readonly when: (iso: string) => string
}

/** The same-shape build the skeleton draws while the first read runs. */
export const HARNESS_BUILD_PLACEHOLDER: HarnessBuildScreenView = {
    id: "placeholder",
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keys: "xxxxxxxxxxxxxxxx",
    repository: { isBound: false, name: "xxxxxxxx", audience: "xxxxxxxx" },
    pullCommand: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ranAt: "xxxxxxxxxx",
    stages: [1, 2, 3].map((n) => ({
        id: `s${n}`,
        title: "xxxxxxxxxxxxxxxx",
        summary: "xxxxxxxxxxxxxxxxxxxx",
        count: "x / x",
        outcome: "xxxxxx",
        tone: "muted",
        isSelected: n === 1,
        href: "/",
    })),
    selected: {
        id: "s1",
        title: "xxxxxxxxxxxxxxxx",
        summary: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        position: "xxxxxxx",
        count: "x / x",
        outcome: "xxxxxx",
        tone: "muted",
        isLocked: false,
        cases: [1, 2, 3].map((n) => ({
            id: `c${n}`,
            title: "xxxxxxxxxxxxxxxxxxxx",
            outcome: "xxxxx",
            tone: "muted",
            isOpen: false,
            detail: "",
        })),
        log: ["xxxxxxxxxxxxxxxxxxxxxxxx", "xxxxxxxxxxxxxxxxxxxxxxxx", "xxxxxxxxxxxxxxxxxxxxxxxx"],
        steps: [{ id: "step", title: "xxxxxxxxxxxxxxxx", markdown: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }],
    },
}

/** The stage a `?stage=` query names; else the first stage not green yet; else the last one. */
const selectedOf = (build: HarnessBuildView, raw: string | undefined): HarnessStageView | undefined =>
    build.stages.find((stage) => stage.id === raw) ??
    build.stages.find((stage) => stage.outcome !== "green") ??
    build.stages[build.stages.length - 1]

/** The mark the log prints for each outcome of a case. */
const MARKS: Readonly<Record<HarnessE2eCaseView["outcome"], string>> = { green: "✓", red: "✗", untested: "·" }

/** The log of the newest run of a stage, as the terminal of the learner's machine printed it. */
const logOf = (stage: HarnessStageView): ReadonlyArray<string> => [
    `$ npm run e2e -- --stage ${stage.id}`,
    ...stage.cases.map(
        (each) => `  ${MARKS[each.outcome]} ${each.title}${each.detail === "" ? "" : `  ${each.detail}`}`,
    ),
]

/** The stage rows of a build, the one named selected. */
const stageRowsOf = (
    build: HarnessBuildView,
    selectedId: string,
    words: HarnessBuildWords,
): ReadonlyArray<HarnessStageItemView> =>
    build.stages.map((each) => ({
        id: each.id,
        title: each.title,
        summary: each.summary,
        count:
            each.proof === "NONE"
                ? words.count(each.passed, each.total)
                : `${words.count(each.passed, each.total)} · ${words.common.proofs[each.proof]}`,
        outcome: words.common.outcomes[each.outcome],
        tone: OUTCOME_TONES[each.outcome],
        isSelected: each.id === selectedId,
        href: harnessBuildPath(build.id, each.id),
    }))

/** The stage on screen as drawn. */
const selectedViewOf = (
    build: HarnessBuildView,
    stage: HarnessStageView,
    words: HarnessBuildWords,
): HarnessSelectedStageView => {
    const outcomeOf = (outcome: HarnessE2eOutcome): string => words.common.outcomes[outcome]
    return {
        id: stage.id,
        title: stage.title,
        summary: stage.summary,
        position: words.position(build.stages.indexOf(stage) + 1, build.stages.length),
        count: words.count(stage.passed, stage.total),
        outcome: outcomeOf(stage.outcome),
        tone: OUTCOME_TONES[stage.outcome],
        isLocked: stage.isLocked,
        cases: stage.cases.map((each) => ({
            id: each.id,
            title: each.title,
            outcome: outcomeOf(each.outcome),
            tone: OUTCOME_TONES[each.outcome],
            isOpen: each.outcome !== "green",
            detail: each.detail,
        })),
        log: logOf(stage),
        steps: stage.steps,
    }
}

/** The build as drawn for the stage the route names, every word resolved; undefined for a build with no stage. */
export const buildViewOf = (
    build: HarnessBuildView,
    rawStage: string | undefined,
    words: HarnessBuildWords,
): HarnessBuildScreenView => {
    const stage = selectedOf(build, rawStage)
    return {
        id: build.id,
        title: build.title,
        summary: build.summary,
        keys: build.keys.join(" · "),
        repository: {
            isBound: build.repository.isBound,
            name: build.repository.name,
            audience: build.repository.audience,
        },
        pullCommand: build.pullCommand,
        ranAt: build.ranAt === "" ? "" : words.when(build.ranAt),
        stages: stageRowsOf(build, stage?.id ?? "", words),
        selected: stage === undefined ? HARNESS_BUILD_PLACEHOLDER.selected : selectedViewOf(build, stage, words),
    }
}
