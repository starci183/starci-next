import type { Judge0CaseResult, Judge0Status } from "@modules/integrations/judge0"
import type { PracticeExample, PracticeTestSummary, PracticeVerdict } from "./practice.contracts"

/** The longest compiler output a submission keeps, in characters. */
export const MAX_COMPILE_OUTPUT = 4000

/** The longest output of a program the example result shows, in characters. */
export const MAX_EXAMPLE_ACTUAL = 2000

/** The Judge0 status a test is shown with. */
const STATUS_LABELS: Readonly<Record<Judge0Status, string>> = {
    accepted: "Accepted",
    "wrong-answer": "Wrong Answer",
    "time-limit": "Time Limit Exceeded",
    "compile-error": "Compilation Error",
    "runtime-error": "Runtime Error",
    "internal-error": "Internal Error",
}

const VERDICTS: Readonly<Record<Exclude<Judge0Status, "accepted">, PracticeVerdict>> = {
    "wrong-answer": "wrong-answer",
    "time-limit": "time-limit-exceeded",
    "compile-error": "compile-error",
    "runtime-error": "runtime-error",
    "internal-error": "internal-error",
}

const clip = (text: string, length: number): string => (text.length > length ? `${text.slice(0, length)}…` : text)

/**
 * The summary of every test judged, in the order the tests were sent. Nothing but the position, the pass flag, the status, the
 * time and the memory is kept, so a hidden test is never revealed; the public examples of a run keep its input, its
 * expected output and what the program printed.
 */
export const summariesOf = (
    results: ReadonlyArray<Judge0CaseResult>,
    examples: ReadonlyArray<PracticeExample>,
): Array<PracticeTestSummary> =>
    results.map((result, index) => {
        const example = examples[index]
        return {
            index,
            passed: result.status === "accepted",
            status: STATUS_LABELS[result.status],
            timeMs: result.timeMs,
            memoryKb: result.memoryKb,
            example:
                example === undefined
                    ? null
                    : {
                          input: example.input,
                          expected: example.output,
                          actual: clip(result.stdout, MAX_EXAMPLE_ACTUAL),
                      },
        }
    })

/**
 * The verdict of a judged submission: a compile error anywhere makes it a compile error, an internal error of the judge comes
 * next, otherwise the first test that did not pass names it, and a submission whose every test passed is accepted.
 */
export const verdictOf = (results: ReadonlyArray<Judge0CaseResult>): PracticeVerdict => {
    if (results.some((result) => result.status === "compile-error")) return "compile-error"
    if (results.some((result) => result.status === "internal-error")) return "internal-error"
    const failed = results.find((result) => result.status !== "accepted")
    return failed === undefined || failed.status === "accepted" ? "accepted" : VERDICTS[failed.status]
}

/** The compiler output of the first test that has one, clipped; null when there is none. */
export const compileOutputOf = (results: ReadonlyArray<Judge0CaseResult>): string | null => {
    const found = results.find((result) => result.compileOutput !== "")
    return found === undefined ? null : clip(found.compileOutput, MAX_COMPILE_OUTPUT)
}

/** The largest value of a measure over the tests that ran, or null when none did. */
export const peakOf = (values: ReadonlyArray<number | null>): number | null => {
    const measured = values.filter((value): value is number => value !== null)
    return measured.length === 0 ? null : Math.max(...measured)
}

/** Whether a verdict counts as a graded attempt for the streak: the judge ran the program, whatever the outcome. */
export const isGraded = (verdict: PracticeVerdict): boolean =>
    verdict !== "internal-error" && verdict !== "queued" && verdict !== "running"
