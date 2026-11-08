import type { ApolloClient } from "@apollo/client"

/** Default Apollo policies: never serve a stale cache entry (SWR owns caching), and let a failed operation throw. */
export const defaultOptions: ApolloClient.DefaultOptions = {
    watchQuery: { fetchPolicy: "no-cache" },
    query: { fetchPolicy: "no-cache" },
    mutate: { fetchPolicy: "no-cache" },
}
