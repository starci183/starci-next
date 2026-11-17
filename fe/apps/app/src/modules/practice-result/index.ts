import type {
    MarkdownBlock,
    PracticeExampleRun,
    PracticeHintItem,
    PracticeResultState,
    PracticeTestRow,
    PracticeVerdictTone,
} from "@starci-next/ui"
import { parseMarkdown } from "@/modules/markdown"
import type { PracticeHintView, PracticeOutcome, PracticeSubmissionView } from "@/modules/types"

/** The tone each verdict is drawn in. */
const VERDICT_TONES: Readonly<Record<PracticeOutcome, PracticeVerdictTone>> = {
    QUEUED: "neutral",
    RUNNING: "neutral",
    ACCEPTED: "success",
    WRONG_ANSWER: "danger",
    TIME_LIMIT_EXCEEDED: "warning",
    COMPILE_ERROR: "warning",
    RUNTIME_ERROR: "danger",
    INTERNAL_ERROR: "neutral",
}

/** True while the judge has not settled the submission. */
export const isUnsettled = (submission: PracticeSubmissionView | undefined): boolean =>
    submission !== undefined && (submission.verdict === "QUEUED" || submission.verdict === "RUNNING")

/** The words the result card is built with, resolved by the block. */
export type PracticeResultWords = {
    readonly verdicts: Readonly<Record<PracticeOutcome, string>>
    readonly testStatuses: Readonly<Record<string, string>>
    readonly example: (position: number) => string
    readonly hidden: (position: number) => string
    readonly summary: (passed: number, total: number) => string
    readonly followUp: (nextSlug: string | null) => string
    readonly runNote: string
    readonly judgeDown: string
}

/** The time and memory of a test or a run in words ("25 ms · 4 MB"); empty when the judge reported neither. */
const usageOf = (timeMs: number | null, memoryKb: number | null): string =>
    [timeMs === null ? "" : `${timeMs} ms`, memoryKb === null ? "" : `${Math.max(1, Math.round(memoryKb / 1024))} MB`]
        .filter((part) => part !== "")
        .join(" · ")

/** The rows of a settled run: test 0 is the public example (a run shows its data), the others are hidden and show status and usage only. */
const testRowsOf = (submission: PracticeSubmissionView, words: PracticeResultWords): ReadonlyArray<PracticeTestRow> =>
    submission.tests.map((test) => {
        const example: PracticeExampleRun | undefined = test.example ?? undefined
        return {
            id: `${test.index}`,
            title: test.index === 0 ? words.example(1) : words.hidden(test.index),
            status: words.testStatuses[test.status] ?? test.status,
            isPassed: test.passed,
            meta: usageOf(test.timeMs, test.memoryKb),
            example,
        }
    })

/** The line under a settled result: what an accepted submission counts for, or that a run does not count. */
const followUpOf = (
    submission: PracticeSubmissionView,
    nextSlug: string | null,
    words: PracticeResultWords,
): string => {
    if (submission.kind === "RUN") return words.runNote
    return submission.verdict === "ACCEPTED" ? words.followUp(nextSlug) : ""
}

/** What the result card draws for a settled submission. */
const settledOf = (
    submission: PracticeSubmissionView,
    nextSlug: string | null,
    words: PracticeResultWords,
): PracticeResultState => {
    if (submission.verdict === "INTERNAL_ERROR") {
        return {
            kind: "settled",
            verdict: words.verdicts.INTERNAL_ERROR,
            tone: "neutral",
            summary: words.judgeDown,
            compileOutput: "",
            rows: [],
            followUp: "",
        }
    }
    const usage = usageOf(submission.timeMs, submission.memoryKb)
    const counts = words.summary(submission.passedCount, submission.totalCount)
    return {
        kind: "settled",
        verdict: words.verdicts[submission.verdict],
        tone: VERDICT_TONES[submission.verdict],
        summary: usage === "" ? counts : `${counts} · ${usage}`,
        compileOutput: submission.compileOutput ?? "",
        rows: testRowsOf(submission, words),
        followUp: followUpOf(submission, nextSlug, words),
    }
}

/** What the result card draws for the last run or submission (or for none yet). */
export const resultStateOf = (
    submission: PracticeSubmissionView | undefined,
    isStarting: boolean,
    nextSlug: string | null,
    words: PracticeResultWords,
): PracticeResultState => {
    if (submission === undefined) return isStarting ? { kind: "pending", isQueued: true } : { kind: "idle" }
    if (isUnsettled(submission)) return { kind: "pending", isQueued: submission.verdict === "QUEUED" }
    return settledOf(submission, nextSlug, words)
}

/** The hint ladder as the composite draws it. */
export const hintsOf = (revealed: ReadonlyArray<PracticeHintView>): ReadonlyArray<PracticeHintItem> =>
    revealed.map((hint) => ({ step: hint.step, title: hint.title, blocks: parseMarkdown(hint.markdown) }))

/** The blocks of a Markdown text, ready for the statement panel. */
export const markdownBlocksOf = (markdown: string): ReadonlyArray<MarkdownBlock> => parseMarkdown(markdown)
