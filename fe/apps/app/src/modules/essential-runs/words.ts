import type { ChallengeLevel, ScenarioRunView } from "@/modules/types"
import type { ScenarioState } from "@starci-next/ui"

/** The words the builders of Source, Scenarios and Apply need, resolved by the hook. */
export type RunWords = {
    readonly scenarioStates: Readonly<Record<ScenarioState, string>>
    readonly scenariosSummary: (green: number, total: number) => string
    readonly fixPrompt: (input: {
        readonly lesson: string
        readonly scenario: string
        readonly title: string
        readonly why: string
        readonly invariant: string
    }) => string
    readonly noRunYet: string
    readonly levels: Readonly<Record<ChallengeLevel, string>>
    readonly points: (points: number) => string
    readonly pointsOf: (earned: number, max: number) => string
    readonly rungLabels: {
        readonly locked: string
        /** The lock of the first rung, which opens once Tìm sạn is green. */
        readonly lockedFirst: string
        readonly open: string
        readonly doing: (score: number, max: number) => string
        readonly passed: (score: number, max: number) => string
    }
    readonly hiddenGreen: (green: number, total: number, score: number, max: number) => string
    readonly applyPrimary: {
        readonly run: (level: string) => string
        readonly rerun: (level: string) => string
    }
}

/** What the learner holds in this visit on Scenarios and Apply: the scenario and the rung on screen, the guards switched off. */
export type RunDesk = {
    /** The scenario the learner chose; empty lets the first scenario not green stand. */
    readonly scenarioId: string
    readonly challengeId: string
    /** The guards the learner switched off, by scenario id; the next run takes them. */
    readonly guardsOff: Readonly<Record<string, boolean>>
}

/** The name of the online machine of the learner, or an empty string when none of them is online. */
export const onlineMachineOf = (
    devices: ReadonlyArray<{ readonly name: string; readonly online: boolean }> | undefined,
): string => devices?.find((device) => device.online)?.name ?? ""

/** The state of a scenario from its newest run: a red run with a guard off is the fault landing, not a failure. */
export const scenarioStateOf = (run: ScenarioRunView | undefined): ScenarioState => {
    if (run === undefined) return "none"
    if (run.status === "running") return "running"
    if (run.status === "passed") return "passed"
    return run.guardsOff.length > 0 ? "guarded" : "failed"
}

/** The newest run of a scenario (a challenge run is the same check id under another slot and is never shown here). */
export const runOf = (runs: ReadonlyArray<ScenarioRunView>, scenarioId: string): ScenarioRunView | undefined =>
    runs.find((each) => each.scenarioId === scenarioId && each.challengeTier === "")
