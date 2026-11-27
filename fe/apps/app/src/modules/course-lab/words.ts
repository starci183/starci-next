import type { LabCaseState, LabNoticeView } from "@starci-next/ui"

/** The notices a lab can carry, each with its words and its one way out, resolved by the hook. */
export type CourseLabNotices = {
    /** The machine dropped while state exists: the last synced code stays under it. */
    readonly lost: LabNoticeView
    /** A command found the machine offline (RELAY_DEVICE_OFFLINE). */
    readonly offline: LabNoticeView
    /** The lab is a Premium part (RELAY_LAB_PREMIUM_REQUIRED): the link to the plans. */
    readonly premium: LabNoticeView
    /** The machine has no device key (RELAY_DEVICE_KEY_MISSING): pair it again. */
    readonly key: LabNoticeView
    /** The previous submission is still being graded (RELAY_LAB_SUBMISSION_RUNNING). */
    readonly running: LabNoticeView
    /** Any other refusal of a command. */
    readonly other: LabNoticeView
    /** A boot stage failed. */
    readonly boot: LabNoticeView
    /** The machine is paired but the relay does not run. */
    readonly pair: LabNoticeView
}

/** The words of the submission, resolved by the hook. */
export type CourseLabSubmitWords = {
    readonly reasonNoRun: string
    readonly reasonRed: string
    readonly reasonLost: string
    /** The two preconditions as ticked lines: every case green on its newest run, the machine connected. */
    readonly checkGreen: string
    readonly checkMachine: string
    readonly gradedNote: string
    readonly passedTitle: string
    readonly failedTitle: string
    readonly waitingTitle: string
    readonly waitingNote: string
    readonly rejectedTitle: string
    /** The sentence of a rejection by its stable reason code. */
    readonly rejected: (reason: string | null) => string
    /** The score of the hidden matrix ("11/12"). */
    readonly score: (passed: number, total: number) => string
}

/** Every word the builders of the lab need, resolved by the hook. */
export type CourseLabWords = {
    /** The name of a boot stage by its id. */
    readonly stage: (id: string) => string
    /** A duration in words ("38s", "0,4s"). */
    readonly duration: (ms: number) => string
    /** The state of the current case in words (passed, failed, running, not run). */
    readonly caseState: (state: LabCaseState) => string
    /** The name of a step of the hidden matrix by its id; an id the app has no word for is shown as it is. */
    readonly step: (id: string) => string
    /** The name of a fault of the hidden matrix by its id; an id the app has no word for is shown as it is. */
    readonly fault: (id: string) => string
    /** The words of a matrix cell (passed, failed, grading, waiting). */
    readonly cell: (kind: "passed" | "failed" | "running" | "waiting") => string
    /** Why the folder typed cannot be used. */
    readonly dirInvalid: string
    /** A moment in words ("14:05"). */
    readonly time: (iso: string) => string
    readonly submit: CourseLabSubmitWords
    readonly notices: CourseLabNotices
}
