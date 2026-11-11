import type { JsonRead } from "./relay-client.contracts"

/** True when `value` is a plain record whose fields may be read. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

/** Parses a JSON text; a malformed one answers the parse failure as its cause instead of throwing. */
export const jsonOf = (text: string): JsonRead => {
    try {
        const value: unknown = JSON.parse(text)
        return { kind: "read", value }
    } catch (error) {
        return { kind: "unreadable", cause: error }
    }
}
