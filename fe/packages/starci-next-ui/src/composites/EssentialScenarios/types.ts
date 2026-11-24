import type { NoMachineDetailsLabels } from "../NoMachineNotice"
import type { MarkdownLabels } from "../StudyBody/types"

/** The state of a scenario as its row shows it. */
export type ScenarioState = "none" | "running" | "passed" | "failed" | "guarded"

/** One row of the list of scenarios. */
export type ScenarioRowView = {
    readonly id: string
    readonly title: string
    readonly fault: string
    readonly state: ScenarioState
    /** The words of the state, for example "Green", "Red", "Not run". */
    readonly stateLabel: string
}

/** The hint of a scenario: kept back until the first red run, then open (and counted as help). */
export type ScenarioHintView = {
    readonly state: "none" | "locked" | "open"
    readonly text: string
    /** True when the learner has run the scenario and may ask for the hint before a red run (it then counts as help). */
    readonly canReveal: boolean
}

/** The guard a scenario can switch off, as the switch draws it. */
export type ScenarioGuardView = {
    readonly id: string
    /** The flag value the command takes, for example "outbox=off". */
    readonly flag: string
    readonly ruleId: string
    readonly isOff: boolean
}

/** The scenario on screen. */
export type ScenarioDetailView = {
    readonly id: string
    readonly title: string
    readonly fault: string
    readonly state: ScenarioState
    readonly stateLabel: string
    /** The line the terminal opens with: the command the run will print or printed. */
    readonly command: string
    /** The output lines of the newest run; empty before a run. */
    readonly output: ReadonlyArray<string>
    /** The message of the red run; empty unless red. */
    readonly why: string
    /** The rule this scenario judges, for example "C2". */
    readonly ruleId: string
    /** The rule in words. */
    readonly ruleText: string
    readonly hint: ScenarioHintView
    /** The prompt to paste into the AI of the learner to fix a red run. */
    readonly fixPrompt: string
    readonly guard: ScenarioGuardView | undefined
}

/** The scenarios part. */
export type ScenariosPartView = {
    readonly rows: ReadonlyArray<ScenarioRowView>
    readonly selected: ScenarioDetailView | undefined
    /** The count of green scenarios in words, for example "2/5 green". */
    readonly summary: string
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
}

/** The words of the panel that sends the learner to their own Claude. */
export type ScenarioAskLabels = {
    readonly title: string
    readonly badge: string
    readonly note: string
    readonly connect: string
}

/** Every word of the scenarios part. */
export type ScenariosLabels = {
    readonly markdown: MarkdownLabels
    readonly list: string
    readonly empty: string
    readonly machineOnline: (name: string) => string
    readonly machineNone: string
    readonly machineNoneNote: string
    /** The install and login commands folded under "Chi tiết kỹ thuật". */
    readonly machineDetails: NoMachineDetailsLabels
    readonly relayNote: string
    readonly noRun: string
    readonly why: string
    readonly ruleBroken: string
    readonly kept: string
    readonly hintTitle: string
    readonly hintLocked: string
    readonly hintNote: string
    readonly hintReveal: string
    readonly fixTitle: string
    readonly fixNote: string
    readonly fixPrompt: string
    readonly fixCopy: string
    readonly guardTitle: string
    readonly guardNote: (flag: string) => string
    readonly flow: string
    readonly ask: ScenarioAskLabels
}
