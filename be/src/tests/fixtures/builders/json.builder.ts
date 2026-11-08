/** The outcome of reading one JSON text: its value, or the failure the text carries. */
export type JsonRead =
    { readonly kind: "read"; readonly value: unknown } | { readonly kind: "failed"; readonly cause: unknown }

/** Reads one JSON text; malformed text answers the failure instead of throwing. */
export const readJson = (raw: string): JsonRead => {
    try {
        return { kind: "read", value: JSON.parse(raw) }
    } catch (cause) {
        return { kind: "failed", cause }
    }
}
