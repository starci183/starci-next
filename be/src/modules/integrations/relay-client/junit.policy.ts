/** One test case of a JUnit XML report. */
export interface JunitCase {
    /** The test name as the framework wrote it. */
    readonly name: string
    /** True when it ran and neither failed nor errored. */
    readonly passed: boolean
    /** True when the framework skipped it; a skipped test counts for nothing. */
    readonly skipped: boolean
}

/** What the tagged tests of one concept came to. */
export interface ConceptRun {
    /** The concept the tests are tagged with. */
    readonly conceptId: string
    /** True when at least one test ran and every test that ran passed. */
    readonly passed: boolean
    /** The names of the tests that ran, in report order. */
    readonly names: ReadonlyArray<string>
}

const CASE = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gu
const NAME = /\bname="([^"]*)"/u
const TAG = /\[([a-z0-9-]+)\]/gu

/** Decodes the five XML entities of an attribute value. */
const decoded = (text: string): string =>
    text
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'")
        .replaceAll("&amp;", "&")

/** The test cases of a JUnit XML report: failed, errored and skipped ones are told from the rest. */
export const junitCasesOf = (xml: string): ReadonlyArray<JunitCase> =>
    [...xml.matchAll(CASE)].map((match) => {
        const inner = match[2] ?? ""
        const skipped = /<skipped\b/u.test(inner)
        return {
            name: decoded(NAME.exec(String(match[1]))?.[1] ?? ""),
            skipped,
            passed: !skipped && !/<(?:failure|error)\b/u.test(inner),
        }
    })

/**
 * The tests tagged `[concept]` in their name, grouped by the concepts a milestone lists: a concept passes when at least one of
 * its tests ran and all that ran passed. Concepts without a running test are left out, so the app never shows a concept the
 * learner has no test for.
 */
export const conceptRunsOf = (
    cases: ReadonlyArray<JunitCase>,
    concepts: ReadonlyArray<string>,
): ReadonlyArray<ConceptRun> =>
    concepts.flatMap((conceptId) => {
        const ran = cases.filter(
            (test) => !test.skipped && [...test.name.matchAll(TAG)].some((tag) => tag[1] === conceptId),
        )
        return ran.length === 0
            ? []
            : [{ conceptId, passed: ran.every((test) => test.passed), names: ran.map((test) => test.name) }]
    })
