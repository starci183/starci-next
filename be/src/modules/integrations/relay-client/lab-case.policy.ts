import {
    CASE_MESSAGE_MAX,
    CASE_VALUE_MAX,
    type CaseResultEvent,
    type CaseStatus,
} from "@modules/platform/relay-protocol"
import type { LabCase, LabManifest } from "./lab-manifest.policy"
import { scenarioCasesOf, type ScenarioCase } from "./scenario-report.policy"

/** Where a case stands in the last report: green, red, or not in it (never run, or the report is gone). */
export type LabCaseState = "green" | "red" | "not-run"

/** What the last JUnit report says about one case: enough for a learner, or an assistant, to know what to look at next. */
export interface LabCaseStatus {
    /** The case id. */
    readonly id: string
    /** Green when at least one test of the case ran and every one that ran passed. */
    readonly state: LabCaseState
    /** The names of the case's tests that failed, their tags cut. */
    readonly failing: ReadonlyArray<string>
    /** The first invariant a failing test named (`[invariant:<id>]`), or null when none did. */
    readonly invariant: string | null
    /** What the failing assertion expected, as Jest prints it (`Expected: …`), or null. */
    readonly expected: string | null
    /** What it got instead (`Received: …`), or null. */
    readonly actual: string | null
    /** The first failure message, at most 500 characters, or null. */
    readonly message: string | null
}

/** The tag a lab test carries to say which case it checks: `[case:<id>]` in its name. */
const caseTagOf = (id: string): string => `[case:${id}]`

const INVARIANT = /\[invariant:([a-z0-9-]+)\]/u
const TAGS = /\s*\[(?:case|invariant):[a-z0-9-]+\]\s*/gu
/** The colour codes Jest writes into a failure message; they are noise outside a terminal. */
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "gu")
const EXPECTED = /^\s*Expected(?: value)?:\s*(.+)$/mu
const RECEIVED = /^\s*Received(?: value)?:\s*(.+)$/mu

/** The test name without its case and invariant tags. */
const plainNameOf = (name: string): string => name.replaceAll(TAGS, " ").replaceAll(/\s+/gu, " ").trim()

/**
 * The status of one case from the tests of a report. The invariant comes from the failing test's name first, then its message: a
 * lab may tag either, and the learner needs the law that broke more than the assertion line.
 */
export const caseStatusOf = (tests: ReadonlyArray<ScenarioCase>, id: string): LabCaseStatus => {
    const mine = tests.filter((test) => !test.skipped && test.name.includes(caseTagOf(id)))
    const failed = mine.filter((test) => !test.passed)
    const first = failed[0]
    // A reporter may keep the message's line breaks as numeric entities (`&#10;`); they are decoded so `Expected:` starts a line.
    const message =
        first?.message
            ?.replaceAll(/&#(x[0-9a-f]+|\d+);/giu, (_whole, code: string) =>
                String.fromCodePoint(code.startsWith("x") || code.startsWith("X") ? parseInt(code.slice(1), 16) : Number(code)),
            )
            .replaceAll(ANSI, "") ?? null
    const invariant =
        first === undefined ? null : (INVARIANT.exec(first.name)?.[1] ?? INVARIANT.exec(message ?? "")?.[1] ?? null)
    return {
        id,
        state: mine.length === 0 ? "not-run" : failed.length === 0 ? "green" : "red",
        failing: failed.map((test) => plainNameOf(test.name)),
        invariant,
        expected: message === null ? null : (EXPECTED.exec(message)?.[1]?.trim() ?? null),
        actual: message === null ? null : (RECEIVED.exec(message)?.[1]?.trim() ?? null),
        message,
    }
}

/** The status of each case from the last report's XML; with no report every case is `not-run`. */
export const caseStatusesOf = (cases: ReadonlyArray<LabCase>, xml: string | null): ReadonlyArray<LabCaseStatus> => {
    const tests = xml === null ? [] : scenarioCasesOf(xml)
    return cases.map((item) => caseStatusOf(tests, item.id))
}

/** The number of hint levels every unhappy case has: a nudge, a direction, then the shape of the fix. */
export const HINT_LEVELS = 3

/** The hint levels each case has unlocked, by case id. */
export type HintLedger = Readonly<Record<string, number>>

/** What asking for a hint level came to. */
export type HintAnswer =
    | { readonly kind: "unlocked"; readonly level: number; readonly text: string; readonly ledger: HintLedger }
    | { readonly kind: "already"; readonly level: number; readonly text: string }
    | { readonly kind: "locked"; readonly next: number }
    | { readonly kind: "no-hints" }
    | { readonly kind: "out-of-range" }

/**
 * Opens a hint level of a case. Levels open strictly in order (asking for 3 before 2 answers `locked` with the level to ask for),
 * because each level gives away more of the fix, and a learner who jumps to the last one skips the thinking the first two ask for.
 * A level already open is shown again without counting twice, so the count the server gets is the number of levels opened.
 */
export const hintOf = (item: LabCase, level: number, ledger: HintLedger): HintAnswer => {
    if (item.kind !== "unhappy") return { kind: "no-hints" }
    if (!Number.isInteger(level) || level < 1 || level > item.hints.length) return { kind: "out-of-range" }
    const opened = ledger[item.id] ?? 0
    const text = item.hints[level - 1]?.vi ?? ""
    if (level <= opened) return { kind: "already", level, text }
    if (level > opened + 1) return { kind: "locked", next: opened + 1 }
    return { kind: "unlocked", level, text, ledger: { ...ledger, [item.id]: level } }
}

/** How many hint levels the learner opened in all, the number a lab submission reports. */
export const hintsOpenedOf = (ledger: HintLedger): number =>
    Object.values(ledger).reduce((sum, level) => sum + level, 0)

/** A value an inspect url placeholder takes: an id, never a path, a query or a host. */
const PARAM_VALUE = /^[A-Za-z0-9._-]{1,100}$/u
const PLACEHOLDER = /\{([A-Za-z][A-Za-z0-9]*)\}/gu

/** What filling an inspect url came to. */
export type InspectUrl =
    | { readonly kind: "url"; readonly url: string }
    | { readonly kind: "unknown-view" }
    | { readonly kind: "bad-params"; readonly missing: ReadonlyArray<string>; readonly invalid: ReadonlyArray<string> }

/**
 * The url of one inspect view with its placeholders filled. Only a view the manifest declares can be called, and each value must
 * look like an id, so an assistant can never steer the request to another path, another host or a query of its own.
 */
export const inspectUrlOf = (
    manifest: LabManifest,
    id: string,
    params: Readonly<Record<string, string>>,
): InspectUrl => {
    const view = manifest.mcp.inspect.find((item) => item.id === id)
    if (view === undefined) return { kind: "unknown-view" }
    const names = [...view.url.matchAll(PLACEHOLDER)].map((match) => String(match[1]))
    const missing = names.filter((name) => params[name] === undefined)
    const invalid = names.filter((name) => params[name] !== undefined && !PARAM_VALUE.test(String(params[name])))
    if (missing.length > 0 || invalid.length > 0) return { kind: "bad-params", missing, invalid }
    return {
        kind: "url",
        url: view.url.replaceAll(PLACEHOLDER, (_whole, name: string) => encodeURIComponent(String(params[name]))),
    }
}

/** The protocol status of a case: a case the report does not name could not be judged, which the protocol calls `error`. */
const protocolStatusOf = (state: LabCaseState): CaseStatus => (state === "not-run" ? "error" : state)

/** What one run of cases came to, as the relay measured it. */
export interface CasesRunFacts {
    /** When the run started (ISO). */
    readonly ranAt: string
    /** How long the test command took. */
    readonly durationMs: number
    /** The commit the learner's checkout stood on, or null. */
    readonly learnerCommit: string | null
    /** The status of each case the run covered, in teaching order. */
    readonly statuses: ReadonlyArray<LabCaseStatus>
}

/**
 * The `case.result` event of a run of `item` (and every case before it). The chaos values are sent as text, the way the protocol
 * carries them; `failed` is present exactly when the case is not green, and says "no test reported this case" when nothing did, so
 * the lesson page never shows a red case without a reason.
 */
export const caseResultEventOf = (manifest: LabManifest, item: LabCase, facts: CasesRunFacts): CaseResultEvent => {
    const status = facts.statuses.find((entry) => entry.id === item.id)
    const state = protocolStatusOf(status?.state ?? "not-run")
    const expected = status?.expected ?? null
    const actual = status?.actual ?? null
    return {
        type: "case.result",
        lessonId: manifest.lessonId,
        caseId: item.id,
        kind: item.kind,
        status: state,
        ranAt: facts.ranAt,
        durationMs: Math.max(0, Math.round(facts.durationMs)),
        learnerCommit: facts.learnerCommit,
        chaos: Object.fromEntries(Object.entries(item.chaos ?? {}).map(([key, value]) => [key, String(value)])),
        upTo: facts.statuses.map((entry) => ({ caseId: entry.id, status: protocolStatusOf(entry.state) })),
        ...(state === "green"
            ? {}
            : {
                  failed: {
                      invariant: status?.invariant ?? null,
                      message: (status?.message ?? `No test of the report is tagged [case:${item.id}].`).slice(
                          0,
                          CASE_MESSAGE_MAX,
                      ),
                      ...(expected === null ? {} : { expected: expected.slice(0, CASE_VALUE_MAX) }),
                      ...(actual === null ? {} : { actual: actual.slice(0, CASE_VALUE_MAX) }),
                  },
              }),
    }
}
