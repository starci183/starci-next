import { createHash } from "node:crypto"
import type { LabFileSnapshot, LabTest } from "./lab.contracts"
import { isLabPath } from "./lab.policy"
import { scenarioCasesOf } from "./scenario-report.policy"

/** The most text one `lab.files` entry carries; a bigger file is sent with its hash alone. */
export const SNAPSHOT_TEXT_MAX_BYTES = 64 * 1024
/** The longest failure message of a test. */
export const TEST_MESSAGE_MAX = 1000
/** The longest test name. */
const TEST_NAME_MAX = 200

const TEST_TAG = /\[(?:test|scenario):([A-Za-z0-9._-]{1,64})\]/u

/** The longest a run of tests may last, in milliseconds (a day: what the relay accepts). */
const DURATION_MAX_MS = 86_400_000

/** The id of a test: its `[test:<id>]` or `[scenario:<id>]` tag, else the slug of its name. */
const testIdOf = (name: string): string => {
    const tagged = TEST_TAG.exec(name)?.[1]
    if (tagged !== undefined) return tagged
    const slug = name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/gu, "-")
        .replaceAll(/^-+|-+$/gu, "")
        .slice(0, 64)
    return slug === "" ? "test" : slug
}

/**
 * The tests of a lab's JUnit report: skipped ones count for nothing and are left out, a test's id is its tag or its name slug
 * (a repeated id gets `-2`, `-3`...), and only a failed test carries its message.
 */
export const labTestsOf = (xml: string): ReadonlyArray<LabTest> => {
    const seen = new Map<string, number>()
    return scenarioCasesOf(xml)
        .filter((test) => !test.skipped)
        .map((test) => {
            const base = testIdOf(test.name)
            const count = (seen.get(base) ?? 0) + 1
            seen.set(base, count)
            return {
                id: count === 1 ? base : `${base}-${count}`,
                name: test.name.replace(TEST_TAG, "").replaceAll(/\s+/gu, " ").trim().slice(0, TEST_NAME_MAX),
                passed: test.passed,
                durationMs: test.timeMs,
                message: test.passed ? "" : (test.message ?? "").slice(0, TEST_MESSAGE_MAX),
            }
        })
}

/**
 * The result of each hidden test of a grading run, in the order of `ids`: the tests of the report that carry the tag `[scenario:<id>]` (or `[cell:<id>]`)
 * decide it (passed only when at least one ran and every one that ran passed; a skipped test counts for nothing), and an id no test
 * reported is a failure, so a grade always names every hidden id exactly once. The name is the id: the relay never reads a hidden test's
 * own title, and the failure message is the test's, cut at 1000 characters; `""` for a pass.
 */
export const gradeTestsOf = (xml: string, ids: ReadonlyArray<string>): ReadonlyArray<LabTest> => {
    const ran = scenarioCasesOf(xml).filter((test) => !test.skipped)
    return ids.map((id) => {
        // A lab@2 grader names its tests by the matrix cell they check (`[cell:<id>]`, the ids of `grader.cells`); older labs say
        // `[scenario:<id>]`. Either tag names the hidden id, so a passing grader is never read as twelve unreported ids.
        const mine = ran.filter((test) => test.name.includes(`[scenario:${id}]`) || test.name.includes(`[cell:${id}]`))
        const failing = mine.find((test) => !test.passed)
        const durationMs = Math.min(DURATION_MAX_MS, Math.round(mine.reduce((sum, test) => sum + test.timeMs, 0)))
        if (mine.length === 0)
            return {
                id,
                name: id,
                passed: false,
                durationMs: 0,
                message: "No test of the grading run reported this scenario.",
            }
        return {
            id,
            name: id,
            passed: failing === undefined,
            durationMs,
            message:
                failing === undefined ? "" : ((failing.message ?? "").trim() || "failed").slice(0, TEST_MESSAGE_MAX),
        }
    })
}

/** True when the bytes read as UTF-8 text with no NUL. */
const isText = (bytes: Buffer): boolean => {
    if (bytes.includes(0)) return false
    try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        return true
    } catch {
        return false
    }
}

/**
 * The snapshot of the lab's files: only the requested paths that the lab's own `files` list allows (an exact, safe path), each with
 * the sha256 of its bytes and its text when it fits in 64 KiB and is text; a file `read` cannot find is left out.
 */
export const snapshotOf = (
    requested: ReadonlyArray<string>,
    allowed: ReadonlyArray<string>,
    read: (path: string) => Buffer | null,
): ReadonlyArray<LabFileSnapshot> =>
    [...new Set(requested)]
        .filter((path) => isLabPath(path) && allowed.includes(path))
        .flatMap((path) => {
            const bytes = read(path)
            if (bytes === null) return []
            const fits = bytes.length <= SNAPSHOT_TEXT_MAX_BYTES && isText(bytes)
            return [
                {
                    path,
                    sha256: createHash("sha256").update(bytes).digest("hex"),
                    text: fits ? bytes.toString("utf8") : null,
                },
            ]
        })
