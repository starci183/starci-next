import { HttpLink } from "@apollo/client"

/**
 * The same-origin GraphQL door of the back end. Every door of the product is reached on the app's own origin (the identity doors
 * the same way), so the HttpOnly session cookie travels without CORS and there is no API origin to configure.
 */
const GRAPHQL_DOOR = "/graphql"

/** The window an operation may take before it is aborted. */
const TIMEOUT_MS = 10_000

/** Terminal link: the HTTP transport to the back end GraphQL door, aborted by the caller's signal or after the window. */
export const createHttpLink = (signal: AbortSignal | undefined): HttpLink =>
    new HttpLink({
        uri: GRAPHQL_DOOR,
        credentials: "same-origin",
        fetchOptions: { signal: signal ?? AbortSignal.timeout(TIMEOUT_MS) },
    })
