import { CombinedGraphQLErrors } from "@apollo/client"
import { ApiFailure } from "@/modules/failure"

/** What the first GraphQL error carries in `extensions`: the stable code, how it travels and the status; each undefined or 0 when absent. */
const extensionsOf = (
    error: CombinedGraphQLErrors,
): { readonly code: string | undefined; readonly kind: string | undefined; readonly status: number } => {
    const extensions = error.errors[0]?.extensions
    return {
        code: typeof extensions?.code === "string" ? extensions.code : undefined,
        kind: typeof extensions?.kind === "string" ? extensions.kind : undefined,
        status: typeof extensions?.status === "number" ? extensions.status : 0,
    }
}

/**
 * The one reader of a GraphQL refusal: runs one operation and rejects with the typed failure. The `extensions.code` is the
 * signal, never the message or the status. A call that never got an answer (network, timeout, abort) rethrows as it is.
 */
export const failing = async <T>(run: () => Promise<T>): Promise<T> => {
    try {
        return await run()
    } catch (error: unknown) {
        if (!CombinedGraphQLErrors.is(error)) throw error
        const { code, kind, status } = extensionsOf(error)
        throw new ApiFailure(status, code, kind)
    }
}
