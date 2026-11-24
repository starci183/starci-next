import type { CodeLineRange, MarkState } from "@starci/grammar/common"

/** The operating system whose Docker note the install step shows; the install command is the same on all three. */
export type LabOsId = "windows" | "macos" | "linux"

/** The two regions under the code: the visible tests and the log tail of each service. */
export type LabBenchTab = "tests" | "logs"

/** What a notice button does; the block maps it to a command or, for `link`, to the destination the notice carries. */
export type LabNoticeAction = "reconnect" | "newCode" | "link"

/** A standing notice above the lab: lost connection or a refused command, in words with its one way out. */
export type LabNoticeView = {
    readonly tone: "negative" | "cautionary"
    readonly title: string
    readonly description: string
    /** The one button of the notice; `href` is set only for a destination (the plans). */
    readonly action:
        { readonly id: LabNoticeAction; readonly label: string; readonly href: string | undefined } | undefined
}

/** Step 1 to 3 of connecting a machine: the OS on screen, the commands and whether a new code is being issued. */
export type LabSetupView = {
    readonly os: LabOsId
    /** `npm i -g @starci/next-relay`, the same on every OS. */
    readonly installCommand: string
    /** `starci-relay pair <code>`; empty until the code is issued. */
    readonly pairCommand: string
    readonly isIssuing: boolean
}

/** One boot stage: machine checks, source, compose up, seed, first test run. */
export type LabStageView = {
    readonly id: string
    readonly label: string
    /** `done`, `running`, `waiting` or `error`. */
    readonly state: MarkState
    /** The time it took, in words ("38s"); empty before it ends. */
    readonly duration: string
    /** The line the machine reported for the stage; empty when none. */
    readonly detail: string
}

/** The boot of the lab on the machine named. */
export type LabBootView = {
    readonly machine: string
    readonly stages: ReadonlyArray<LabStageView>
}

/** One chaos switch of the lab. */
export type LabChaosView = { readonly id: string; readonly label: string; readonly isOn: boolean }

/** One visible test with the result of the last run. */
export type LabTestView = {
    readonly id: string
    readonly name: string
    /** `done` (passed), `error` (failed) or `notRun`. */
    readonly state: MarkState
    /** The words of the state, for example "Đạt", "Chưa đạt". */
    readonly stateLabel: string
    readonly duration: string
    /** The failure message of a red test; empty otherwise. */
    readonly message: string
}

/** The log tail of one service. */
export type LabLogView = { readonly service: string; readonly lines: ReadonlyArray<string> }

/** The file on screen: its path, language, text and the faulty lines the page marks. */
export type LabCodeView = {
    readonly path: string
    readonly language: string
    readonly code: string
    readonly highlightLines: ReadonlyArray<CodeLineRange>
    /** True when the machine did not send the text (the file is larger than the cap). */
    readonly isOmitted: boolean
}

/** The lab on the learner's machine, ready: header strip, files with the code, tests and logs. */
export type LabWorkView = {
    readonly name: string
    readonly branch: string
    /** The services that report a log, shown as "n service đang chạy". */
    readonly services: number
    readonly chaos: ReadonlyArray<LabChaosView>
    /** True from the moment tests were requested until their results are read. */
    readonly isRunRequested: boolean
    readonly files: ReadonlyArray<string>
    readonly selectedPath: string
    readonly code: LabCodeView | undefined
    readonly tests: ReadonlyArray<LabTestView>
    /** "2/3 test đạt". */
    readonly testsSummary: string
    readonly logs: ReadonlyArray<LabLogView>
    readonly tab: LabBenchTab
    /** When the machine last synced, in words; empty when never. */
    readonly lastSynced: string
}

/** The submit command: its reason while it cannot be pressed. */
export type LabSubmitView = {
    readonly isDisabled: boolean
    /** Why the command is grey; empty when it can be pressed. */
    readonly reason: string
    readonly isPending: boolean
}

/** The newest submission, worded; the tests named are hidden ones, by id. */
export type LabSubmissionView = {
    readonly outcome: "passed" | "failed" | "waiting" | "rejected"
    readonly title: string
    readonly description: string
    /** Ids of the hidden tests that failed; empty unless graded and red. */
    readonly failedIds: ReadonlyArray<string>
}

/** What a lab that has no machine yet draws. */
export type LabPairBody = { readonly shape: "pair"; readonly setup: LabSetupView }

/** What a lab that is starting draws. */
export type LabBootBody = { readonly shape: "boot"; readonly boot: LabBootView }

/** What a ready lab draws. */
export type LabWorkBody = {
    readonly shape: "work"
    readonly work: LabWorkView
    readonly submit: LabSubmitView
    readonly submission: LabSubmissionView | undefined
    /** True once a submission passed: the solution on the main branch opens. */
    readonly hasSolution: boolean
}

/** The part of the lab the learner is in. */
export type LabBody = LabPairBody | LabBootBody | LabWorkBody

/** What the learner does in the panel. */
export type LessonLabActions = {
    readonly selectOs: (os: LabOsId) => void
    readonly newCode: () => void
    readonly selectFile: (path: string) => void
    readonly selectTab: (tab: LabBenchTab) => void
    readonly toggleChaos: (id: string, isOn: boolean) => void
    readonly runTests: () => void
    readonly submit: () => void
    readonly openSolution: () => void
    readonly notice: (action: LabNoticeAction) => void
}

/** The OS tab and its Docker note. */
export type LabOsLabels = { readonly id: LabOsId; readonly label: string; readonly docker: string }

/** The words of connecting a machine. */
export type LabSetupLabels = {
    readonly title: string
    readonly note: string
    readonly osTabs: string
    readonly os: ReadonlyArray<LabOsLabels>
    readonly installStep: string
    readonly pairStep: string
    readonly codeNote: string
    readonly newCode: string
    readonly doneStep: string
    readonly waiting: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** The words of the boot. */
export type LabBootLabels = {
    readonly title: (machine: string) => string
    readonly firstTime: string
}

/** The words of the ready lab. */
export type LabWorkLabels = {
    readonly services: (count: number) => string
    readonly chaos: string
    readonly run: string
    readonly running: string
    readonly files: string
    readonly readOnly: string
    readonly omitted: string
    readonly noFile: string
    readonly benchTabs: string
    readonly tests: string
    readonly logs: string
    readonly testsEmpty: string
    readonly logsEmpty: string
    readonly lastSynced: (when: string) => string
    readonly codeCopy: string
    readonly codeCopied: string
    readonly codeCopyFailed: string
}

/** The words of the submission. */
export type LabSubmitLabels = {
    readonly submit: string
    readonly graded: string
    readonly failedHidden: string
    readonly solution: string
}

/** Every word of the lab panel. */
export type LessonLabLabels = {
    readonly setup: LabSetupLabels
    readonly boot: LabBootLabels
    readonly work: LabWorkLabels
    readonly submit: LabSubmitLabels
}
