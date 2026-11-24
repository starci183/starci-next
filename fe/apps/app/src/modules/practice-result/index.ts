import type {
    PracticeExampleRun,
    PracticeHintItem,
    PracticeResultState,
    PracticeTestRow,
    PracticeVerdictTone,
} from "@starci-next/ui"
import type { PracticeHintView, PracticeOutcome, PracticeSubmissionView } from "@/modules/types"

/** The tone each verdict is drawn in. */
const VERDICT_TONES: Readonly<Record<PracticeOutcome, PracticeVerdictTone>> = {
    QUEUED: "informative",
    RUNNING: "affirmative",
    ACCEPTED: "affirmative",
    WRONG_ANSWER: "negative",
    TIME_LIMIT_EXCEEDED: "cautionary",
    COMPILE_ERROR: "cautionary",
    RUNTIME_ERROR: "negative",
    INTERNAL_ERROR: "cautionary",
}

/** True while the judge has not settled the submission. */
export const isUnsettled = (submission: PracticeSubmissionView | undefined): boolean =>
    submission !== undefined && (submission.verdict === "QUEUED" || submission.verdict === "RUNNING")

/** The words the result is built with, resolved by the block. */
export type PracticeResultWords = {
    readonly testStatuses: Readonly<Record<string, string>>
    readonly example: (position: number) => string
    readonly hidden: (position: number) => string
    readonly notRun: string
    readonly running: string
    readonly accepted: (passed: number, total: number) => string
    readonly acceptedUsage: (usage: string) => string
    readonly acceptedHinted: string
    readonly failedAt: (verdict: PracticeOutcome, test: number) => string
    readonly failedNote: (passed: number, total: number) => string
    readonly compileError: string
    readonly compileNote: string
    readonly pendingTitle: (done: number, total: number) => string
    readonly pendingQueued: string
    readonly pendingNote: string
    readonly runNote: (passed: number, total: number) => string
    readonly judgeDown: string
    readonly judgeDownNote: string
}

/** The time and memory of a test or a run in words ("25 ms · 4 MB"); empty when the judge reported neither. */
const usageOf = (timeMs: number | null, memoryKb: number | null): string =>
    [timeMs === null ? "" : `${timeMs} ms`, memoryKb === null ? "" : `${Math.max(1, Math.round(memoryKb / 1024))} MB`]
        .filter((part) => part !== "")
        .join(" · ")

/** The rows of a run: the tests the judge reported, then one row per test it did not reach (a running one first, while the judge works). */
const testRowsOf = (
    submission: PracticeSubmissionView,
    isRunning: boolean,
    words: PracticeResultWords,
): ReadonlyArray<PracticeTestRow> => {
    const reported: ReadonlyArray<PracticeTestRow> = submission.tests.map((test) => {
        const example: PracticeExampleRun | undefined = test.example ?? undefined
        return {
            id: `${test.index}`,
            title:
                test.index < 2 && example !== undefined ? words.example(test.index + 1) : words.hidden(test.index + 1),
            status: "done",
            isPassed: test.passed,
            meta: usageOf(test.timeMs, test.memoryKb) || (words.testStatuses[test.status] ?? test.status),
            example,
        }
    })
    const missing = Math.max(0, submission.totalCount - reported.length)
    const pending: ReadonlyArray<PracticeTestRow> = Array.from({ length: missing }, (_, offset) => ({
        id: `pending-${offset}`,
        title: words.hidden(reported.length + offset + 1),
        status: isRunning && offset === 0 ? "running" : "waiting",
        isPassed: false,
        meta: isRunning && offset === 0 ? words.running : words.notRun,
        example: undefined,
    }))
    return [...reported, ...pending]
}

/** The first test that did not pass, counted from one; the total when the judge names none. */
const failedTestOf = (submission: PracticeSubmissionView): number => {
    const failed = submission.tests.find((test) => !test.passed)
    return failed === undefined ? submission.passedCount + 1 : failed.index + 1
}

/** What the result draws for a settled submission: the verdict line, the one sentence under it and the test rows. */
const settledOf = (
    submission: PracticeSubmissionView,
    usedHints: number,
    words: PracticeResultWords,
): PracticeResultState => {
    const base = {
        kind: "settled" as const,
        tone: VERDICT_TONES[submission.verdict],
        compileOutput: "",
        isAccepted: false,
    }
    const rows = testRowsOf(submission, false, words)
    if (submission.verdict === "INTERNAL_ERROR") {
        return { ...base, title: words.judgeDown, description: words.judgeDownNote, rows: [] }
    }
    if (submission.verdict === "COMPILE_ERROR") {
        return {
            ...base,
            title: words.compileError,
            description: words.compileNote,
            compileOutput: submission.compileOutput ?? "",
            rows: [],
        }
    }
    if (submission.kind === "RUN") {
        return {
            ...base,
            title: words.accepted(submission.passedCount, submission.totalCount),
            description: words.runNote(submission.passedCount, submission.totalCount),
            rows,
        }
    }
    if (submission.verdict === "ACCEPTED") {
        const usage = usageOf(submission.timeMs, submission.memoryKb)
        const lead = usage === "" ? "" : words.acceptedUsage(usage)
        return {
            ...base,
            isAccepted: true,
            title: words.accepted(submission.passedCount, submission.totalCount),
            description: [lead, usedHints > 0 ? words.acceptedHinted : ""].filter((part) => part !== "").join(" "),
            rows,
        }
    }
    return {
        ...base,
        title: words.failedAt(submission.verdict, failedTestOf(submission)),
        description: words.failedNote(submission.passedCount, submission.totalCount),
        rows,
    }
}

/** What the result draws for the last run or submission (or for none yet). */
export const resultStateOf = (
    submission: PracticeSubmissionView | undefined,
    isStarting: boolean,
    usedHints: number,
    words: PracticeResultWords,
): PracticeResultState => {
    if (submission === undefined) {
        return isStarting
            ? { kind: "pending", title: words.pendingQueued, description: words.pendingNote, rows: [] }
            : { kind: "idle" }
    }
    if (isUnsettled(submission)) {
        const done = submission.tests.length
        return {
            kind: "pending",
            title:
                submission.verdict === "QUEUED" ? words.pendingQueued : words.pendingTitle(done, submission.totalCount),
            description: words.pendingNote,
            rows: testRowsOf(submission, true, words),
        }
    }
    return settledOf(submission, usedHints, words)
}

/** The hint ladder as the composite draws it. */
export const hintsOf = (revealed: ReadonlyArray<PracticeHintView>): ReadonlyArray<PracticeHintItem> =>
    revealed.map((hint) => ({ step: hint.step, title: hint.title, markdown: hint.markdown }))
