import type { E2eOutcome, StageOutcome } from "./harness.contracts"
import type { ScenarioCase } from "./scenario-report.policy"

const TAG = /\[([a-z0-9][a-z0-9-]*):([a-z0-9][a-z0-9-]*)\]/gu

/** The `[stage:e2e]` pairs a test name carries. */
const pairsOf = (name: string): ReadonlyArray<string> => [...name.matchAll(TAG)].map((tag) => `${tag[1]}:${tag[2]}`)

/** One e2e id: the tests tagged `[<stage>:<e2e>]` that ran; none that ran means it did not run and did not pass. */
const e2eOutcomeOf = (cases: ReadonlyArray<ScenarioCase>, stageId: string, id: string): E2eOutcome => {
    const ran = cases.filter((test) => !test.skipped && pairsOf(test.name).includes(`${stageId}:${id}`))
    return {
        id,
        passed: ran.length > 0 && ran.every((test) => test.passed),
        notRun: ran.length === 0,
        timeMs: ran.reduce((sum, test) => sum + test.timeMs, 0),
    }
}

/** The outcomes of the asked stages, in order, read from the test cases of one report. Only the pairs the plan lists count. */
export const stageOutcomesOf = (
    cases: ReadonlyArray<ScenarioCase>,
    asked: ReadonlyArray<{
        readonly n: number
        readonly stage: { readonly id: string; readonly e2e: ReadonlyArray<string> }
    }>,
): ReadonlyArray<StageOutcome> =>
    asked.map(({ n, stage }) => {
        const e2e = stage.e2e.map((id) => e2eOutcomeOf(cases, stage.id, id))
        return {
            n,
            id: stage.id,
            e2e,
            passed: e2e.every((item) => item.passed),
            timeMs: e2e.reduce((sum, item) => sum + item.timeMs, 0),
        }
    })

/** The lines of the stage table: a header, one row per stage and a total. Names and counts only, never a test message. */
export const stageTableOf = (stages: ReadonlyArray<StageOutcome>): ReadonlyArray<string> => {
    const rows = stages.map((stage) => {
        const passed = stage.e2e.filter((item) => item.passed).length
        const notRun = stage.e2e.filter((item) => item.notRun).length
        const state = stage.passed ? "PASS" : notRun === stage.e2e.length ? "NOT RUN" : "FAIL"
        return [
            String(stage.n),
            stage.id,
            String(stage.e2e.length),
            String(passed),
            String(stage.e2e.length - passed),
            `${(stage.timeMs / 1000).toFixed(1)}s`,
            state,
        ]
    })
    const table = [["#", "Stage", "E2E", "Passed", "Failed", "Time", "Result"], ...rows]
    const widths = table[0]?.map((_, column) => Math.max(...table.map((row) => row[column]?.length ?? 0))) ?? []
    const line = (row: ReadonlyArray<string>): string =>
        row
            .map((cell, column) => cell.padEnd(widths[column] ?? 0))
            .join("  ")
            .trimEnd()
    const done = stages.filter((stage) => stage.passed).length
    return [...table.map((row) => line(row)), `${done}/${stages.length} stage(s) passed`]
}
