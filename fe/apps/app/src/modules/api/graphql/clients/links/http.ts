import { HttpLink } from "@apollo/client"
import { graphqlUrl } from "@/modules/config"

/** The window an operation may take before it is aborted. */
const TIMEOUT_MS = 10_000

/**
 * Terminal link: the HTTP transport to the GraphQL door of the back end api (its own origin, `NEXT_PUBLIC_API_URL`), aborted by the
 * caller's signal or after the window. The Bearer access token is attached by the link before it; the refresh cookie is never sent here.
 */
export const createHttpLink = (signal: AbortSignal | undefined): HttpLink =>
    new HttpLink({
        uri: graphqlUrl,
        credentials: "omit",
        fetchOptions: { signal: signal ?? AbortSignal.timeout(TIMEOUT_MS) },
    })
