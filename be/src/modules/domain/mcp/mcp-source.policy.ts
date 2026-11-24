import type { LessonSourceTree } from "@modules/domain/lesson"
import type { McpCatalog, McpFile, McpSearchHit } from "./mcp.contracts"

/** The folder or file names (a whole path segment, lower case) that hold what a learner's AI never reads. */
const DENIED_SEGMENTS: ReadonlySet<string> = new Set([
    ".git",
    ".github",
    ".env",
    "hidden",
    ".hidden",
    "hidden-tests",
    "submissions",
    "submission",
    "mutants",
    "mutant",
    "mutation",
    "answers",
    "answer",
    "answer-key",
    "answer-keys",
    "solutions",
    "solution",
    "rubric",
    "rubrics",
    "expected-evidence",
    "secrets",
    "starci-source.json",
])

/** A name that gives a file away whatever folder it sits in (hidden tests, rubrics, keys, answers, mutants, credentials). */
const DENIED_NAME =
    /(?:^|[._-])(?:hidden|rubric|answers?|solutions?|mutants?|submissions?|secrets?|credentials?)(?:[._-]|$)|\.(?:pem|key|p12|pfx|env)$|^\.env/iu

/** Folders a search skips because they hold dependencies or build output, not the lesson's code. */
const SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set(["node_modules", "dist", "build", "coverage", ".next"])

/** The longest file the AI reads, in bytes. */
export const FILE_BYTES_MAX = 1_000_000
/** The most lines one `read_file` answers. */
export const LINES_MAX = 1000
/** The most hits one search answers. */
export const HITS_MAX = 30
/** The longest text of one hit. */
export const HIT_TEXT_MAX = 240

/**
 * The repository-relative path a learner's AI may read, or null when it is outside the repository or names something kept
 * back: an absolute path, a `..` segment, a backslash, a NUL, or a denied folder or file name.
 */
export const readablePathOf = (path: string): string | null => {
    if (
        path.length === 0 ||
        path.length > 300 ||
        /[\0\\]/u.test(path) ||
        path.startsWith("/") ||
        /^[A-Za-z]:/u.test(path)
    )
        return null
    const segments = path.split("/").filter((segment) => segment !== "" && segment !== ".")
    if (segments.length === 0 || segments.some((segment) => segment === ".." || /\p{Cc}/u.test(segment))) return null
    if (segments.some((segment) => DENIED_SEGMENTS.has(segment.toLowerCase()) || DENIED_NAME.test(segment))) return null
    const normal = segments.join("/")
    return normal
}

/** True when a directory name is one a search never enters. */
export const skippedDirectory = (name: string): boolean => SKIPPED_DIRECTORIES.has(name)

/** True when the first bytes of a file contain a NUL, so the file is binary and never shown. */
export const isBinary = (head: Uint8Array): boolean => head.includes(0)

/** The asked line range of a text, clamped to the file and to `LINES_MAX`. */
export const fileOf = (path: string, commit: string, text: string, from?: number, to?: number): McpFile => {
    const lines = text.split(/\r?\n/u)
    const total = lines.length
    const start = Math.min(Math.max(Math.trunc(from ?? 1), 1), total)
    const end = Math.min(Math.max(Math.trunc(to ?? start + LINES_MAX - 1), start), start + LINES_MAX - 1, total)
    return {
        path,
        commit,
        from: start,
        to: end,
        total,
        text: lines.slice(start - 1, end).join("\n"),
        truncated: end < total,
        nextFrom: end < total ? end + 1 : null,
    }
}

/** A text trimmed to one hit's size. */
export const hitTextOf = (text: string): string => {
    const trimmed = text.trim()
    return trimmed.length > HIT_TEXT_MAX ? `${trimmed.slice(0, HIT_TEXT_MAX)}…` : trimmed
}

/**
 * The public catalog of a lesson, projected from its source tree: the pinned commit, the scenarios (each with the command the
 * learner runs) and the invariants, each revealed by the first scenario that judges it. The tree carries no hidden scenario, expected
 * output or hint, and only the invariant location that points at a readable path is kept.
 */
export const catalogOf = (lessonId: string, tree: LessonSourceTree): McpCatalog => ({
    commit: tree.commit,
    scenarios: tree.scenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        fault: scenario.fault,
        invariant: scenario.invariant,
        guards: scenario.guards,
        command: `starci-relay run ${lessonId} --scenario ${scenario.id}${scenario.guards[0] === undefined ? "" : ` [--guard ${scenario.guards[0]}=off]`}`,
    })),
    invariants: tree.invariants.map((invariant) => ({
        id: invariant.id,
        name: invariant.id,
        statement: invariant.text,
        where:
            invariant.where !== null && readablePathOf(invariant.where.split(":")[0] ?? "") !== null
                ? invariant.where
                : null,
        revealedBy: tree.scenarios.find((scenario) => scenario.invariant === invariant.id)?.id ?? null,
    })),
})

/** A literal, case-insensitive keyword search over texts: every term (at most 8) must appear on the line; hits in text order. */
export const keywordHitsOf = (
    texts: ReadonlyArray<{ readonly path: string; readonly text: string; readonly title?: string }>,
    query: string,
): Array<McpSearchHit> => {
    const terms = query
        .toLowerCase()
        .split(/\s+/u)
        .filter((term) => term.length > 0)
        .slice(0, 8)
    const hits: Array<McpSearchHit> = []
    if (terms.length === 0) return hits
    for (const item of texts) {
        const lines = item.text.split(/\r?\n/u)
        for (let index = 0; index < lines.length && hits.length < HITS_MAX; index += 1) {
            const line = lines[index] ?? ""
            const lower = line.toLowerCase()
            if (terms.every((term) => lower.includes(term)))
                hits.push({
                    path: item.path,
                    line: index + 1,
                    text: hitTextOf(line),
                    ...(item.title === undefined ? {} : { title: item.title }),
                })
        }
        if (hits.length >= HITS_MAX) break
    }
    return hits
}
