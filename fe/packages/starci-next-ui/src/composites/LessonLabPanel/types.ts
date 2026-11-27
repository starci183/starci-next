import type { CodeLineRange, MarkState } from "@starci/grammar/common"

/** The operating system whose Docker note the install step shows; the install command is the same on all three. */
export type LabOsId = "windows" | "macos" | "linux"

/** The two regions under the code: the result of the current case and the log tail of each service. */
export type LabBenchTab = "case" | "logs"

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

/** Step 1 to 3 of the setup page: the OS on screen, the commands, the machine and the folder the lab goes in. */
export type LabSetupView = {
    readonly os: LabOsId
    /** `npm i -g @starci/next-relay`, the same on every OS. */
    readonly installCommand: string
    /** `starci-relay pair <code>`; empty until the code is issued or once a machine is paired. */
    readonly pairCommand: string
    readonly isIssuing: boolean
    /** True once a machine is paired; the pairing command is then not needed. */
    readonly isPaired: boolean
    /** True while a paired machine is online and can take the lab. */
    readonly isOnline: boolean
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
    /** The folder on the learner's machine, as typed (the default is `~/starci/<course>/<lesson>`). */
    readonly dir: string
    /** Why the folder cannot be used; empty when it can. */
    readonly dirError: string
    /** True from the moment the lab was asked to start until the machine answers. */
    readonly isStarting: boolean
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

/** The line that closes the setup once the first run is done: the file to open. */
export type LabReadyView = {
    /** The ONE file the learner edits; empty when the lab names none. */
    readonly learnerFile: string
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
    /** True when this is the ONE file the learner edits; the others are the lab's and read-only. */
    readonly isLearnerFile: boolean
}

/** Where the current case stands. */
export type LabCaseState = "notRun" | "running" | "passed" | "failed"

/** The result of the current case, which the page passes in: its status and, when red, the invariant that failed with what was expected and found. */
export type LabCaseResultView = {
    /** The case's title in the learner's language. */
    readonly title: string
    readonly state: LabCaseState
    /** The words of the state, in the learner's language. */
    readonly stateLabel: string
    /** The invariant that failed, in words; empty unless the case is red. */
    readonly invariant: string
    /** What the invariant expected; empty unless the case is red. */
    readonly expected: string
    /** What was found; empty unless the case is red. */
    readonly actual: string
}

/** The lab column of a loop page on the learner's machine, ready: the code, the result of the current case and the logs. */
export type LabWorkView = {
    readonly files: ReadonlyArray<string>
    readonly selectedPath: string
    readonly code: LabCodeView | undefined
    /** The current case; undefined while the page has none to show. */
    readonly caseResult: LabCaseResultView | undefined
    readonly logs: ReadonlyArray<LabLogView>
    readonly tab: LabBenchTab
    /** When the machine last synced, in words; empty when never. */
    readonly lastSynced: string
    /** True while the relay on the learner's machine is online; the file card says so in its head. */
    readonly isOnline: boolean
}

/** One cell of the hidden grader matrix: one fault at one step. */
export type LabMatrixCellView = {
    readonly id: string
    /** `done`, `error`, `running` or `waiting`. */
    readonly state: MarkState
    /** The words of the cell: passed, failed, grading or waiting, in the learner's language. */
    readonly stateLabel: string
}

/** One row of the matrix: a step with its cell under each fault, in the order of `faults`. */
export type LabMatrixRowView = {
    readonly id: string
    readonly label: string
    readonly cells: ReadonlyArray<LabMatrixCellView>
}

/** The hidden grader matrix, steps by faults. */
export type LabMatrixView = {
    readonly faults: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly rows: ReadonlyArray<LabMatrixRowView>
    /** "11/12" once graded; empty before. */
    readonly score: string
}

/** The submit command: its reason while it cannot be pressed. */
export type LabSubmitView = {
    readonly isDisabled: boolean
    /** Why the command is grey; empty when it can be pressed. */
    readonly reason: string
    readonly isPending: boolean
}

/** The newest submission, worded; the cells and tests named are hidden ones. */
export type LabSubmissionView = {
    readonly outcome: "passed" | "failed" | "waiting" | "rejected"
    readonly title: string
    readonly description: string
    /** The names of the hidden cells (or tests) that failed; empty unless graded and red. */
    readonly failed: ReadonlyArray<string>
}

/** What the setup page draws: the steps, the boot progress once started and the closing line once ready. */
export type LabSetupBody = {
    readonly shape: "setup"
    readonly setup: LabSetupView
    readonly boot: LabBootView | undefined
    readonly ready: LabReadyView | undefined
}

/** What the lab column of a loop page draws once the lab is ready. */
export type LabWorkBody = { readonly shape: "work"; readonly work: LabWorkView }

/** What the submit page draws once the lab is ready. */
export type LabSubmitBody = {
    readonly shape: "submit"
    /** The matrix; undefined for a lab that grades none. */
    readonly matrix: LabMatrixView | undefined
    readonly submit: LabSubmitView
    readonly submission: LabSubmissionView | undefined
}

/** What a loop or submit page draws while the lab is not ready: one line that points back to the setup. */
export type LabWaitingBody = { readonly shape: "waiting" }

/** The part of the lab the page shows. */
export type LabBody = LabSetupBody | LabWorkBody | LabSubmitBody | LabWaitingBody

/** What the learner does in the panel. */
export type LessonLabActions = {
    readonly selectOs: (os: LabOsId) => void
    readonly newCode: () => void
    readonly changeDir: (dir: string) => void
    /** Boots the lab in the folder typed. */
    readonly startLab: () => void
    readonly selectFile: (path: string) => void
    readonly selectTab: (tab: LabBenchTab) => void
    readonly submit: () => void
    readonly notice: (action: LabNoticeAction) => void
}

/** The OS tab and its Docker note. */
export type LabOsLabels = { readonly id: LabOsId; readonly label: string; readonly docker: string }

/** The words of the setup page. */
export type LabSetupLabels = {
    readonly title: string
    /** The card in the rail of the setup page: the machine, its relay and what the relay does (owner 2026-11-27, split setup page). */
    readonly machineTitle: string
    readonly note: string
    readonly osTabs: string
    readonly os: ReadonlyArray<LabOsLabels>
    readonly installStep: string
    readonly pairStep: string
    readonly codeNote: string
    readonly newCode: string
    readonly connected: string
    readonly notConnected: string
    /** The badge of the machine card's head: no machine paired yet, the relay running, the relay stopped. */
    readonly notPaired: string
    readonly relayOn: string
    readonly relayOff: string
    readonly waiting: string
    readonly dirStep: string
    readonly dirLabel: string
    readonly dirNote: string
    readonly start: string
    readonly starting: string
    /** Why the build button waits: the machine is not paired yet. */
    readonly startReason: string
    /** Why the build button waits: the machine is paired but its relay is not running. */
    readonly startReasonOffline: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** The words of the boot. */
export type LabBootLabels = {
    readonly title: (machine: string) => string
    readonly firstTime: string
    /** The stages in the order the machine runs them, listed in the machine card before the learner starts the lab. */
    readonly plan: ReadonlyArray<string>
}

/** The words of the closing line of the setup. */
export type LabReadyLabels = {
    readonly title: string
    /** The line that names the file to open in the editor. */
    readonly openFile: (file: string) => string
    /** The line for a lab that names no learner file. */
    readonly openAny: string
}

/** The words of the result of the current case. */
export type LabCaseLabels = {
    readonly title: string
    /** Shown while the page has no case to show. */
    readonly none: string
    /** Shown for a case that has not run. */
    readonly notRun: string
    readonly invariant: string
    readonly expected: string
    readonly actual: string
}

/** The words of the lab column of a loop page. */
export type LabWorkLabels = {
    /** The card of the lab column (owner 2026-11-27): the file the learner edits, then the result and the logs. */
    readonly title: string
    /** The line under the card: saving the file runs the case again on the machine. */
    readonly saveNote: string
    readonly files: string
    /** The note of the ONE file the learner edits. */
    readonly learnerFile: string
    /** The note of any other synced file. */
    readonly otherFile: string
    readonly omitted: string
    readonly noFile: string
    readonly benchTabs: string
    readonly caseTab: string
    readonly logs: string
    readonly logsEmpty: string
    readonly lastSynced: (when: string) => string
    /** The relay's state in the file card's head: running, or stopped (the code is then the last synced copy). */
    readonly relayOn: string
    readonly relayOff: string
    readonly codeCopy: string
    readonly codeCopied: string
    readonly codeCopyFailed: string
    readonly case: LabCaseLabels
}

/** The words of the submit page. */
export type LabSubmitLabels = {
    readonly title: string
    readonly note: string
    readonly matrix: string
    readonly step: string
    readonly submit: string
    readonly resubmit: string
    readonly graded: string
    readonly failedHidden: string
}

/** The words of a loop or submit page while the lab is not ready. */
export type LabWaitingLabels = { readonly title: string; readonly text: string }

/** Every word of the lab panel. */
export type LessonLabLabels = {
    readonly setup: LabSetupLabels
    readonly boot: LabBootLabels
    readonly ready: LabReadyLabels
    readonly work: LabWorkLabels
    readonly submit: LabSubmitLabels
    readonly waiting: LabWaitingLabels
}
