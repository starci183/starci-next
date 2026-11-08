import { AGENT_TRACKS, PROJECT_KINDS, type AgentTrack, type ProjectKind } from "./project.contracts"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"

/** The longest name, topic, language and stack line a project carries. */
export const NAME_MAX = 80
const TOPIC_MAX = 120
const LANGUAGE_MAX = 40
const STACK_MAX = 120
const URL_MAX = 300
const LOCATION_MAX = 200
const SYMBOL_MAX = 80
const ENDPOINT_MAX = 200
const SAMPLE_BODY_MAX = 2000

/** The longest explanation of a code read, in characters. */
export const EXPLANATION_MAX = 600

/** The shortest explanation of a code read: two short sentences. */
export const EXPLANATION_MIN = 40

/** The longest code excerpt a code read takes, in characters. */
export const EXCERPT_MAX = 12_000

const invalid = (field: string): ProjectError =>
    new ProjectError({ code: ProjectErrorCode.InputInvalid, params: { field } })

const SECRET_NAMES: ReadonlySet<string> = new Set([
    "credentials",
    "secret.yaml",
    "secret.yml",
    "secret.json",
    "secrets.yaml",
    "secrets.yml",
    "secrets.json",
    "secrets.toml",
])
const SECRET_PREFIXES: ReadonlyArray<string> = [".env", "id_rsa", "id_ed25519", "credentials."]
const SECRET_SUFFIXES: ReadonlyArray<string> = [".pem", ".key", ".p12"]
const ENDPOINT = /^(GET|POST|PUT|PATCH|DELETE) \/[\w\-./{}:?=&%~]*$/u

/** Whether a character is a control character, which no name, path or text of a project may carry. */
const isControl = (character: string): boolean => {
    const code = Number(character.codePointAt(0))
    return code < 32 || code === 127
}

/** Whether the text carries a control character. */
const hasControl = (text: string): boolean => [...text].some((character) => isControl(character))

/** Whether the last segment of a path names a file that holds secrets. */
const isSecretFile = (path: string): boolean => {
    const name = path.slice(path.lastIndexOf("/") + 1).toLowerCase()
    return (
        SECRET_NAMES.has(name) ||
        SECRET_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
        SECRET_SUFFIXES.some((suffix) => name.endsWith(suffix))
    )
}

/** Patterns of values that look like a secret: keys, tokens, private keys, JWTs and quoted credentials. */
const SECRET_PATTERNS: ReadonlyArray<RegExp> = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
    /\bAKIA[0-9A-Z]{16}\b/u,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/u,
    /\bsk-[A-Za-z0-9_-]{20,}\b/u,
    /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/u,
    /\bAIza[0-9A-Za-z_-]{35}\b/u,
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/u,
    /\b(?:api[_-]?key|secret|token|passw(?:or)?d)\s*[:=]\s*["'][^"'\s]{8,}["']/iu,
]

/** Whether the text holds a value that looks like a secret. */
export const hasSecret = (text: string): boolean => SECRET_PATTERNS.some((pattern) => pattern.test(text))

/** A trimmed text of 1 to `max` characters without control characters, or the field is invalid. */
export const textOf = (raw: string, field: string, max: number): string => {
    const text = raw.trim()
    if (text === "" || text.length > max || hasControl(text)) throw invalid(field)
    return text
}

/** The kind of a project, or the field is invalid. */
export const kindOf = (raw: string): ProjectKind => {
    const kind = PROJECT_KINDS.find((candidate) => candidate === raw)
    if (kind === undefined) throw invalid("kind")
    return kind
}

/** The agent track of an agent project: absent for an app, one of the tools for an agent. */
export const trackOf = (raw: string | null, kind: ProjectKind): AgentTrack | null => {
    if (raw === null) return null
    const track = AGENT_TRACKS.find((candidate) => candidate === raw)
    if (kind !== "agent" || track === undefined) throw invalid("track")
    return track
}

/** A repository address: https, no credentials, at most 300 characters; null for none. */
export const repoUrlOf = (raw: string | null): string | null => {
    if (raw === null || raw.trim() === "") return null
    const text = textOf(raw, "repoUrl", URL_MAX)
    let url: URL
    try {
        url = new URL(text)
    } catch (cause) {
        throw new ProjectError({ code: ProjectErrorCode.InputInvalid, params: { field: "repoUrl" }, cause })
    }
    if (url.protocol !== "https:" || url.username !== "" || url.password !== "") throw invalid("repoUrl")
    return url.toString()
}

/**
 * The code location a learner points to: `path` or `path#symbol`, a relative path inside the repo (no absolute path, no `..`, no
 * drive letter) that is not a secret-like file.
 */
export const locationOf = (raw: string): string => {
    const text = raw.trim()
    const [path = "", symbol, ...rest] = text.split("#")
    const bad = hasControl(text) || text.includes("\\") || /^([a-zA-Z]:|\/|~)/u.test(path)
    const climbs = path.split("/").some((part) => part === ".." || part === "")
    const symbolBad = symbol !== undefined && (symbol === "" || symbol.length > SYMBOL_MAX)
    if (
        text === "" ||
        path.length > LOCATION_MAX ||
        bad ||
        climbs ||
        symbolBad ||
        rest.length > 0 ||
        isSecretFile(path)
    ) {
        throw new ProjectError({ code: ProjectErrorCode.LocationInvalid })
    }
    return text
}

/** The endpoint probes aim at: `METHOD /path`. */
export const endpointOf = (raw: string): string => {
    const text = raw.trim()
    if (text.length > ENDPOINT_MAX || !ENDPOINT.test(text))
        throw new ProjectError({ code: ProjectErrorCode.EndpointInvalid })
    return text
}

/** The JSON body the probes send: small, and parseable. */
export const sampleBodyOf = (raw: string): string => {
    const text = raw.trim()
    try {
        JSON.parse(text)
    } catch (cause) {
        throw new ProjectError({ code: ProjectErrorCode.EndpointInvalid, cause })
    }
    if (text.length > SAMPLE_BODY_MAX) throw new ProjectError({ code: ProjectErrorCode.EndpointInvalid })
    return text
}

/** The learner's explanation of a code read: at least two sentences, at most 600 characters. */
export const explanationOf = (raw: string): string => {
    const text = raw.trim()
    const sentences = text.split(/[.!?]+/u).filter((part) => part.trim() !== "").length
    if (text.length < EXPLANATION_MIN || text.length > EXPLANATION_MAX || sentences < 2) {
        throw new ProjectError({ code: ProjectErrorCode.ExplanationInvalid })
    }
    return text
}

/** The code excerpt of a code read: not empty, at most 12000 characters, and free of secret-like values. */
export const excerptOf = (raw: string): string => {
    const text = raw.trim()
    if (text === "" || text.length > EXCERPT_MAX) throw invalid("excerpt")
    if (hasSecret(text)) throw new ProjectError({ code: ProjectErrorCode.ExcerptSecret })
    return text
}

/** Limits other policies share. */
export const INPUT_LIMITS: Readonly<Record<"topic" | "language" | "stack" | "url", number>> = {
    topic: TOPIC_MAX,
    language: LANGUAGE_MAX,
    stack: STACK_MAX,
    url: URL_MAX,
} as const
