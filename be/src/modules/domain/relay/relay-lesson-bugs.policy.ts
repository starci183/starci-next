import { lessonBugCheckId, type LessonBugPack, type LessonBugTest } from "@modules/domain/lesson"
import type { LessonRunStatus, LessonScenarioRunView } from "./relay-lesson.service"

/** Where one bug-pack test stands for the learner: no run yet, or the newest run's state. */
export type LessonBugStatus = "none" | LessonRunStatus

/**
 * One test of the Tìm sạn bug pack with the learner's newest run and what it earned: `pass` after a green run, `fail` after a red
 * one, and the hints the learner opened so far, one at a time, while the test is red. A locked final test shows nothing of its run.
 */
export interface LessonBugResult {
    /** The test id. */
    readonly testId: string
    /** No run yet, running, passed or failed. */
    readonly status: LessonBugStatus
    /** True for the final test while some other test of the pack is not green: it is not signed for a run. */
    readonly isLocked: boolean
    /** When the newest run was stored, ISO 8601, or null. */
    readonly at: string | null
    /** What the newest red run measured, or null. */
    readonly received: string | null
    /** The output tail of the newest run, or null. */
    readonly output: string | null
    /** "Vì sao giờ đúng", only after a green run; null otherwise. */
    readonly pass: string | null
    /** "Vì sao chưa pass", only after a red run; null otherwise. */
    readonly fail: string | null
    /** The hints opened so far, in order; only while the newest run is red. */
    readonly hints: ReadonlyArray<string>
    /** How many hints the learner opened (recorded even after the test turns green). */
    readonly hintsOpened: number
    /** How many hints the test has. */
    readonly hintCount: number
}

/** The hint-use key of the n-th hint (from 1) of a bug-pack test: `bug:<test id>#<n>`. */
export const bugHintKeyOf = (testId: string, level: number): string => `${lessonBugCheckId(testId)}#${level}`

/** How many hints of a test the learner opened, from the hint-use keys of the lesson. */
export const openedHintsOf = (testId: string, keys: ReadonlySet<string>): number => {
    const prefix = `${lessonBugCheckId(testId)}#`
    return Math.max(
        0,
        ...[...keys].filter((key) => key.startsWith(prefix)).map((key) => Number(key.slice(prefix.length)) || 0),
    )
}

/** True for a hint-use key of the bug pack: opening those hints costs nothing and does not mark the lesson as helped. */
export const isBugHintKey = (key: string): boolean => /^bug:[a-z0-9-]+#\d+$/u.test(key)

/** The newest run of a test, by its relay check id. */
const runOf = (test: LessonBugTest, runs: ReadonlyArray<LessonScenarioRunView>): LessonScenarioRunView | undefined =>
    runs.find((run) => run.scenarioId === lessonBugCheckId(test.id))

/** True once every test of the pack but the final one passed: the final test then opens. */
export const isFinalOpenOf = (pack: LessonBugPack, runs: ReadonlyArray<LessonScenarioRunView>): boolean =>
    pack.tests.filter((test) => !test.isFinal).every((test) => runOf(test, runs)?.status === "passed")

/**
 * Every test of the pack with the learner's newest run and what it earned (see `LessonBugResult`). The texts are copied only
 * when earned, so a test the learner never ran carries none of them.
 */
export const bugResultsOf = (
    pack: LessonBugPack,
    runs: ReadonlyArray<LessonScenarioRunView>,
    hintKeys: ReadonlySet<string>,
): ReadonlyArray<LessonBugResult> => {
    const isFinalOpen = isFinalOpenOf(pack, runs)
    return pack.tests.map((test): LessonBugResult => {
        const isLocked = test.isFinal && !isFinalOpen
        const run = isLocked ? undefined : runOf(test, runs)
        const status: LessonBugStatus = run?.status ?? "none"
        const opened = Math.min(openedHintsOf(test.id, hintKeys), test.hints.length)
        return {
            testId: test.id,
            status,
            isLocked,
            at: run?.at ?? null,
            received: status === "failed" ? (run?.received ?? null) : null,
            output: run?.output ?? null,
            pass: status === "passed" ? test.pass : null,
            fail: status === "failed" ? test.fail : null,
            hints: status === "failed" ? test.hints.slice(0, opened) : [],
            hintsOpened: opened,
            hintCount: test.hints.length,
        }
    })
}

/** Why the next hint of a test cannot be opened, or the level (from 1) to record. */
export type NextBugHint =
    | { readonly kind: "open"; readonly level: number }
    | { readonly kind: "not-red" }
    | { readonly kind: "none-left" }
    | { readonly kind: "unknown" }

/** The next hint of a test: only while its newest run is red, one at a time, never past the last. */
export const nextBugHintOf = (
    pack: LessonBugPack,
    testId: string,
    runs: ReadonlyArray<LessonScenarioRunView>,
    hintKeys: ReadonlySet<string>,
): NextBugHint => {
    const result = bugResultsOf(pack, runs, hintKeys).find((each) => each.testId === testId)
    if (result === undefined) return { kind: "unknown" }
    if (result.status !== "failed") return { kind: "not-red" }
    if (result.hintsOpened >= result.hintCount) return { kind: "none-left" }
    return { kind: "open", level: result.hintsOpened + 1 }
}
