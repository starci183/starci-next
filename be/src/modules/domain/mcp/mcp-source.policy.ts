import type { McpCatalog, McpCatalogInvariant, McpFile, McpScenario } from "./mcp.contracts"

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
export const FILE_BYTES_MAX = 200_000
/** The most lines one `read_file` answers. */
export const LINES_MAX = 400
/** The most hits one search answers. */
export const HITS_MAX = 30
/** The longest text of one hit. */
export const HIT_TEXT_MAX = 240

/**
 * The repository-relative path a learner's AI may read, or null when it is outside the repository or names something kept
 * back: an absolute path, a `..` segment, a backslash, a NUL, a denied folder or file name, or a prefix the teacher denied.
 */
export const readablePathOf = (path: string, deny: ReadonlyArray<string>): string | null => {
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
    const lower = normal.toLowerCase()
    if (
        deny.some((prefix) => {
            const denied = prefix.toLowerCase().replace(/^\/+|\/+$/gu, "")
            return denied.length > 0 && (lower === denied || lower.startsWith(`${denied}/`))
        })
    )
        return null
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
    return { path, commit, from: start, to: end, total, text: lines.slice(start - 1, end).join("\n") }
}

/** A text trimmed to one hit's size. */
export const hitTextOf = (text: string): string => {
    const trimmed = text.trim()
    return trimmed.length > HIT_TEXT_MAX ? `${trimmed.slice(0, HIT_TEXT_MAX)}…` : trimmed
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const INVARIANT_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/u

const textOf = (value: unknown, max: number): string | null =>
    typeof value === "string" && value.length > 0 && value.length <= max ? value : null

const slugsOf = (value: unknown): Array<string> | null => {
    if (value === undefined) return []
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && SLUG.test(item))) return null
    return value as Array<string>
}

const scenarioOf = (lessonId: string, value: unknown): McpScenario | null | "hidden" => {
    if (typeof value !== "object" || value === null) return null
    const raw = value as Record<string, unknown>
    // A hidden scenario is dropped before anything else of it is read: it is not part of the public catalog at all.
    if (raw.hidden === true) return "hidden"
    const id = textOf(raw.id, 64)
    const title = textOf(raw.title, 200)
    const fault = textOf(raw.fault, 600)
    const guards = slugsOf(raw.guards)
    if (id === null || !SLUG.test(id) || title === null || fault === null || guards === null) return null
    const invariant = raw.invariant === undefined ? null : textOf(raw.invariant, 32)
    const guardArgs = guards.length === 0 ? "" : ` [--guard ${guards[0] ?? ""}=off]`
    return {
        id,
        title,
        fault,
        invariant,
        guards,
        command: `starci-next run ${lessonId} --scenario ${id}${guardArgs}`,
    }
}

const invariantOf = (value: unknown): McpCatalogInvariant | null => {
    if (typeof value !== "object" || value === null) return null
    const raw = value as Record<string, unknown>
    const id = textOf(raw.id, 32)
    const name = textOf(raw.name, 200)
    const statement = textOf(raw.statement, 600)
    if (id === null || !INVARIANT_ID.test(id) || name === null || statement === null) return null
    return {
        id,
        name,
        statement,
        where: raw.where === undefined ? null : textOf(raw.where, 200),
        revealedBy: raw.revealedBy === undefined ? null : textOf(raw.revealedBy, 64),
    }
}

/**
 * The public catalog of a lesson checkout, projected field by field from its `starci-source.json`: the pinned commit, the
 * scenarios that are not hidden, the invariants and the extra denied prefixes. Any field not named here (a hidden scenario,
 * an expected output, an answer, a mutant) is never copied. Null when the file is not a catalog.
 */
export const catalogOf = (lessonId: string, raw: unknown): McpCatalog | null => {
    if (typeof raw !== "object" || raw === null) return null
    const document = raw as Record<string, unknown>
    const commit = textOf(document.commit, 64)
    if (commit === null || !/^[0-9a-f]{7,64}$/u.test(commit)) return null
    const scenarios: Array<McpScenario> = []
    for (const item of Array.isArray(document.scenarios) ? (document.scenarios as Array<unknown>) : []) {
        const scenario = scenarioOf(lessonId, item)
        if (scenario !== null && scenario !== "hidden") scenarios.push(scenario)
    }
    const invariants = (Array.isArray(document.invariants) ? (document.invariants as Array<unknown>) : []).flatMap(
        (item) => invariantOf(item) ?? [],
    )
    const deny = (Array.isArray(document.deny) ? (document.deny as Array<unknown>) : []).flatMap((item) =>
        typeof item === "string" && item.length > 0 && item.length <= 200 ? [item.replace(/^\/+|\/+$/gu, "")] : [],
    )
    return { commit, scenarios, invariants, deny }
}
