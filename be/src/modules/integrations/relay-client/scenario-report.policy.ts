import type { LessonScenario } from "./lesson.contracts"

/** One test case of a scenario report, with what the test printed. */
export interface ScenarioCase {
    /** The test name as written. */
    readonly name: string
    /** True when it ran and neither failed nor errored. */
    readonly passed: boolean
    /** True when it was skipped; a skipped test counts for nothing. */
    readonly skipped: boolean
    /** How long it took, in milliseconds. */
    readonly timeMs: number
    /** The failure message, or null. */
    readonly message: string | null
    /** The `[ledger]` lines it printed. */
    readonly ledger: ReadonlyArray<string>
    /** The `[timeline]` lines it printed. */
    readonly timeline: ReadonlyArray<string>
}

/** What the tests tagged with one scenario came to. */
export interface ScenarioResult {
    /** The scenario id. */
    readonly scenarioId: string
    /** True when at least one test ran and every test that ran passed. */
    readonly passed: boolean
    /** The scenario's concepts that had a running test. */
    readonly concepts: ReadonlyArray<string>
    /** The tests that ran, in report order. */
    readonly tests: ReadonlyArray<ScenarioCase>
    /** The failing tests with their messages. */
    readonly failing: ReadonlyArray<{ readonly name: string; readonly message: string }>
    /** The invariant ids the failure messages named, in order, once each. */
    readonly invariantIds: ReadonlyArray<string>
    /** The first `[invariant:id] hint` message, at most 300 characters, or null. */
    readonly why: string | null
}

const CASE = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gu
const ATTR = (name: string): RegExp => new RegExp(`\\b${name}="([^"]*)"`, "u")
const FAILURE = /<(?:failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:failure|error)>)/u
const SYSTEM_OUT = /<system-out>([\s\S]*?)<\/system-out>/u
const TAG = /\[([a-z0-9-]+)\]/gu
const SCENARIO_TAG = /\[scenario:([a-z0-9-]+)\]/gu
const INVARIANT = /\[invariant:([a-z0-9-]+)\]/u
const WHY_MAX = 300
const LEDGER_MAX = 4000

const decoded = (text: string): string =>
    text
        .replace(/^\s*<!\[CDATA\[/u, "")
        .replace(/\]\]>\s*$/u, "")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'")
        .replaceAll("&amp;", "&")

/** The lines of a system-out that start with a prefix, the prefix cut. */
const linesOf = (out: string, prefix: string): ReadonlyArray<string> =>
    out
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line.startsWith(prefix))
        .map((line) => line.slice(prefix.length).trim())

/** The test cases of a JUnit XML report with their messages, ledger and timeline lines. */
export const scenarioCasesOf = (xml: string): ReadonlyArray<ScenarioCase> =>
    [...xml.matchAll(CASE)].map((match) => {
        const attrs = String(match[1])
        const inner = match[2] ?? ""
        const failure = FAILURE.exec(inner)
        const message = failure
            ? decoded(ATTR("message").exec(String(failure[1]))?.[1] ?? "") || decoded((failure[2] ?? "").trim())
            : null
        const out = SYSTEM_OUT.exec(inner)?.[1]
        const time = Number(ATTR("time").exec(attrs)?.[1] ?? "0")
        const skipped = /<skipped\b/u.test(inner)
        return {
            name: decoded(ATTR("name").exec(attrs)?.[1] ?? ""),
            skipped,
            passed: !skipped && failure === null,
            timeMs: Number.isFinite(time) ? Math.round(time * 1000) : 0,
            message: message === null ? null : message.slice(0, 500),
            ledger: out === undefined ? [] : linesOf(decoded(out), "[ledger]"),
            timeline: out === undefined ? [] : linesOf(decoded(out), "[timeline]"),
        }
    })

/** The scenario ids a test name is tagged with. */
const scenariosOfName = (name: string): ReadonlyArray<string> =>
    [...name.matchAll(SCENARIO_TAG)].map((tag) => String(tag[1]))

/** The result of one scenario: the tests tagged `[scenario:id]`; none that ran means it was not run and did not pass. */
export const scenarioResultOf = (cases: ReadonlyArray<ScenarioCase>, scenario: LessonScenario): ScenarioResult => {
    const ran = cases.filter((test) => !test.skipped && scenariosOfName(test.name).includes(scenario.id))
    const failing = ran.filter((test) => !test.passed).map((test) => ({ name: test.name, message: test.message ?? "" }))
    const invariantIds = [...new Set(failing.flatMap((test) => INVARIANT.exec(test.message)?.[1] ?? []))]
    const firstWhy = failing.find((test) => INVARIANT.test(test.message))
    const tagged = new Set(ran.flatMap((test) => [...test.name.matchAll(TAG)].map((tag) => String(tag[1]))))
    return {
        scenarioId: scenario.id,
        passed: ran.length > 0 && failing.length === 0,
        concepts: scenario.concepts.filter((concept) => tagged.has(concept)),
        tests: ran,
        failing,
        invariantIds,
        why: firstWhy === undefined ? null : firstWhy.message.slice(0, WHY_MAX),
    }
}

/** The ledger of a result as one text for the upload. */
export const ledgerTextOf = (result: ScenarioResult): string =>
    result.tests
        .flatMap((test) => [...test.ledger, ...test.timeline.map((line) => `t+${line}`)])
        .join("\n")
        .slice(0, LEDGER_MAX)

/** The lines the CLI prints for a result: the timeline of tests, each with its ledger and timeline lines, and the why on red. */
export const ledgerLinesOf = (
    result: ScenarioResult,
    invariants: Readonly<Record<string, string>>,
): ReadonlyArray<string> => {
    const tests = result.tests.flatMap((test) => [
        `  ${test.passed ? "PASS" : "FAIL"}  ${test.name}  (${test.timeMs} ms)`,
        ...test.timeline.map((line) => `        timeline  ${line}`),
        ...test.ledger.map((line) => `        ledger    ${line}`),
    ])
    if (result.tests.length === 0) return ["  no test is tagged [scenario:" + result.scenarioId + "]: not run"]
    const why = result.invariantIds.map((id) => `  Why wrong: invariant "${invariants[id] ?? id}" (${id}) is broken`)
    const hints = result.failing.map((test) => `        ${test.message}`).filter((line) => line.trim() !== "")
    return [...tests, ...(result.passed ? [] : [...why, ...hints])]
}
