import { isRecord } from "@modules/platform/primitives"
import type { AssertOp, FlowResponse } from "./check-flow.contracts"

/** The values a template reads: the run's inputs and what earlier steps captured. */
export type FlowScope = Readonly<Record<string, unknown>>

/** A resolved template, or the name of the input it needs and lacks. */
export type Resolved = { readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly missing: string }

const TEMPLATE = /\{\{\s*([\w.-]+)\s*(?:\?\?\s*([^}]*?)\s*)?\}\}/gu
const WHOLE = /^\{\{\s*([\w.-]+)\s*(?:\?\?\s*([^}]*?)\s*)?\}\}$/u

/** The text of a value as a template writes it: a string as it is, anything else as JSON. */
export const textOf = (value: unknown): string => (typeof value === "string" ? value : JSON.stringify(value))

const lookup = (scope: FlowScope, name: string, fallback: string | undefined): Resolved => {
    const value = scope[name]
    if (value !== undefined && value !== null) return { ok: true, value }
    return fallback === undefined ? { ok: false, missing: name } : { ok: true, value: fallback }
}

/**
 * Resolves a template: `{{name}}` reads the scope and `{{name ?? fallback}}` falls back to a literal. A string that is one template
 * alone keeps the value's type (a captured list stays a list); a template inside text is written as text. A name the scope lacks,
 * with no fallback, is reported as missing.
 */
export const resolveTemplate = (template: unknown, scope: FlowScope): Resolved => {
    if (typeof template !== "string") return { ok: true, value: template }
    const whole = WHOLE.exec(template)
    if (whole !== null) return lookup(scope, String(whole[1]), whole[2])
    let missing: string | null = null
    const value = template.replace(TEMPLATE, (_match, name: string, fallback: string | undefined) => {
        const found = lookup(scope, name, fallback)
        if (!found.ok) {
            missing ??= found.missing
            return ""
        }
        return textOf(found.value)
    })
    return missing === null ? { ok: true, value } : { ok: false, missing }
}

/** The names a template reads, without the ones that have a fallback. */
export const templateNamesOf = (template: string): ReadonlyArray<string> =>
    [...template.matchAll(TEMPLATE)].filter((match) => match[2] === undefined).map((match) => String(match[1]))

/** One segment of a JSON path: a key, an index, or every element. */
type PathSegment = { readonly key: string } | { readonly index: number } | { readonly every: true }

const SEGMENT = /^(?:\.([A-Za-z_$][\w$-]*)|\[(\d+)\]|\[\*\]|\['([^']*)'\])/u

/** The segments of a JSON path (`$.items[*].id`, `$.error['code']`), or null when it is not one. */
export const pathSegmentsOf = (path: string): ReadonlyArray<PathSegment> | null => {
    if (!path.startsWith("$")) return null
    const segments: Array<PathSegment> = []
    let rest = path.slice(1)
    while (rest !== "") {
        const match = SEGMENT.exec(rest)
        if (match === null) return null
        if (match[1] !== undefined) segments.push({ key: match[1] })
        else if (match[2] !== undefined) segments.push({ index: Number(match[2]) })
        else if (match[3] !== undefined) segments.push({ key: match[3] })
        else segments.push({ every: true })
        rest = rest.slice(match[0].length)
    }
    return segments
}

const stepInto = (value: unknown, segment: PathSegment): unknown => {
    if ("every" in segment) return Array.isArray(value) ? value : undefined
    if ("index" in segment) return Array.isArray(value) ? value[segment.index] : undefined
    if (segment.key === "length" && (Array.isArray(value) || typeof value === "string")) return value.length
    return isRecord(value) ? value[segment.key] : undefined
}

/** The value at a JSON path; after `[*]` the rest of the path maps over the elements and the result is a list. */
export const valueAtPath = (root: unknown, path: string): unknown => {
    const segments = pathSegmentsOf(path)
    if (segments === null) return undefined
    const walk = (value: unknown, index: number): unknown => {
        const segment = segments[index]
        if (segment === undefined) return value
        if ("every" in segment) {
            if (!Array.isArray(value)) return undefined
            return value.map((element) => walk(element, index + 1)).filter((element) => element !== undefined)
        }
        return walk(stepInto(value, segment), index + 1)
    }
    return walk(root, 0)
}

/** The body parsed as JSON, or undefined when it is not JSON. */
export const jsonOf = (body: string): unknown => {
    try {
        return JSON.parse(body) as unknown
    } catch {
        return undefined
    }
}

/** Whether a status matches a pattern: a code (`429`), a class (`2xx`) or `any`. */
export const statusMatches = (status: number, pattern: string): boolean => {
    if (pattern === "any") return true
    const klass = /^([1-5])xx$/u.exec(pattern)
    if (klass !== null) return Math.floor(status / 100) === Number(klass[1])
    return String(status) === pattern
}

/** Whether a text is a status pattern. */
export const isStatusPattern = (text: string): boolean => text === "any" || /^(?:[1-5]xx|[1-5]\d\d)$/u.test(text)

const numberOf = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value)
    return null
}

/** Equality as a flow means it: numbers and numeric text compare as numbers, lists and objects by their JSON. */
export const looseEquals = (actual: unknown, expected: unknown): boolean => {
    const left = numberOf(actual)
    const right = numberOf(expected)
    if (left !== null && right !== null) return left === right
    if (typeof actual === "string" && typeof expected === "string") return actual === expected
    return actual !== undefined && JSON.stringify(actual) === JSON.stringify(expected)
}

const listOf = (value: unknown): ReadonlyArray<unknown> => (Array.isArray(value) ? value : [value])

const compare = (actual: unknown, expected: unknown, test: (left: number, right: number) => boolean): boolean => {
    const left = numberOf(actual)
    const right = numberOf(expected)
    return left !== null && right !== null && test(left, right)
}

const contains = (actual: unknown, expected: unknown): boolean => {
    if (Array.isArray(actual)) return actual.some((element) => looseEquals(element, expected))
    return typeof actual === "string" && actual.includes(textOf(expected))
}

const matches = (actual: unknown, expected: unknown): boolean =>
    actual !== undefined && actual !== null && new RegExp(textOf(expected), "u").test(textOf(actual))

const OPS: Readonly<Record<AssertOp, (actual: unknown, expected: unknown) => boolean>> = {
    eq: looseEquals,
    ne: (actual, expected) => !looseEquals(actual, expected),
    in: (actual, expected) => listOf(expected).some((element) => looseEquals(actual, element)),
    notIn: (actual, expected) => !listOf(expected).some((element) => looseEquals(actual, element)),
    is: (actual, expected) => {
        const status = numberOf(actual)
        return status !== null && statusMatches(status, textOf(expected))
    },
    gt: (actual, expected) => compare(actual, expected, (left, right) => left > right),
    gte: (actual, expected) => compare(actual, expected, (left, right) => left >= right),
    lt: (actual, expected) => compare(actual, expected, (left, right) => left < right),
    lte: (actual, expected) => compare(actual, expected, (left, right) => left <= right),
    exists: (actual, expected) => (actual !== undefined && actual !== null) === (expected !== false),
    contains,
    notContains: (actual, expected) => actual !== undefined && !contains(actual, expected),
    matches,
    notMatches: (actual, expected) => actual !== undefined && !matches(actual, expected),
    disjoint: (actual, expected) =>
        Array.isArray(actual) &&
        Array.isArray(expected) &&
        !actual.some((element) => expected.some((other) => looseEquals(element, other))),
}

/** Whether an assertion holds. */
export const holds = (op: AssertOp, actual: unknown, expected: unknown): boolean => OPS[op](actual, expected)

/** The facts a step's responses expose to selectors, and the steps before it. */
export interface SelectorContext {
    /** The responses of the step the assertion belongs to. */
    readonly own: ReadonlyArray<FlowResponse>
    /** The responses of every earlier step, by id. */
    readonly steps: ReadonlyMap<string, ReadonlyArray<FlowResponse>>
    /** The captured values. */
    readonly scope: FlowScope
}

const sortedKeysOf = (body: string): unknown => {
    const parsed = jsonOf(body)
    return isRecord(parsed) ? Object.keys(parsed).sort().join(",") : undefined
}

/** The value of a single-response selector (`status`, `ms`, `body`, `keys`, `header <name>`, `json <path>`). */
const singleOf = (response: FlowResponse | undefined, words: ReadonlyArray<string>): unknown => {
    if (response === undefined) return undefined
    const [field, argument] = words
    if (field === "status") return response.status
    if (field === "ms") return response.ms
    if (field === "body") return response.body
    if (field === "keys") return sortedKeysOf(response.body)
    if (field === "header" && argument !== undefined) return response.headers[argument.toLowerCase()]
    if (field === "json" && argument !== undefined) return valueAtPath(jsonOf(response.body), argument)
    return undefined
}

const countOf = (responses: ReadonlyArray<FlowResponse>, words: ReadonlyArray<string>): number => {
    const [pattern = "any", field, name] = words
    const matching = responses.filter((response) => statusMatches(response.status, pattern))
    if (field === "header" && name !== undefined) {
        return matching.filter((response) => response.headers[name.toLowerCase()] !== undefined).length
    }
    return matching.length
}

const distinctOf = (responses: ReadonlyArray<FlowResponse>, words: ReadonlyArray<string>): number =>
    new Set(responses.map((response) => textOf(singleOf(response, words) ?? null))).size

/** The words of a selector, a JSON path kept whole. */
const wordsOf = (expression: string): ReadonlyArray<string> => expression.trim().split(/\s+/u)

const SINGLE_FIELDS: ReadonlyArray<string> = ["status", "ms", "body", "keys", "header", "json"]

/** The value a selector reads over a list of responses. */
const evaluate = (responses: ReadonlyArray<FlowResponse>, words: ReadonlyArray<string>): unknown => {
    const [head = "", ...rest] = words
    if (head === "count") return countOf(responses, rest)
    if (head === "distinct") return distinctOf(responses, rest)
    if (head === "max" && rest[0] === "ms") return Math.max(0, ...responses.map((response) => response.ms))
    if (head === "first") {
        const [pattern = "any", ...field] = rest
        return singleOf(
            responses.find((response) => statusMatches(response.status, pattern)),
            field,
        )
    }
    if (head === "all") {
        return responses.map((response) => singleOf(response, rest))
    }
    return SINGLE_FIELDS.includes(head) ? singleOf(responses[0], words) : undefined
}

/** The heads a selector may start with, after an optional `<step>.` prefix. */
export const SELECTOR_HEADS: ReadonlyArray<string> = [
    ...SINGLE_FIELDS,
    "count",
    "distinct",
    "max",
    "first",
    "all",
    "var",
]

/** The step a selector names with `<step>.`, and the rest; no prefix means the assertion's own step. */
export const splitSelector = (
    selector: string,
    stepIds: ReadonlySet<string>,
): { readonly step: string | null; readonly expression: string } => {
    const dot = selector.indexOf(".")
    const space = selector.indexOf(" ")
    const prefix = dot > 0 && (space < 0 || dot < space) ? selector.slice(0, dot) : null
    return prefix !== null && stepIds.has(prefix)
        ? { step: prefix, expression: selector.slice(dot + 1) }
        : { step: null, expression: selector }
}

/**
 * The value a selector reads: `status`, `ms`, `body`, `keys`, `header <name>`, `json <path>` on the first response; `count
 * [<pattern> [header <name>]]`, `distinct <field>`, `max ms`, `first <pattern> <field>` and `all <field>` over every response of a
 * fan-out or a sink; `var <name>` for a captured value; and any of them on an earlier step as `<step>.<selector>`.
 */
export const select = (selector: string, context: SelectorContext): unknown => {
    const { step, expression } = splitSelector(selector, new Set(context.steps.keys()))
    const words = wordsOf(expression)
    if (words[0] === "var") return context.scope[words[1] ?? ""]
    const responses = step === null ? context.own : (context.steps.get(step) ?? [])
    return evaluate(responses, words)
}
