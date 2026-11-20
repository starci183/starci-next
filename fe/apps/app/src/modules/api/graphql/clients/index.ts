import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client"
import { createAttachLocaleLink, createAttachTokenLink, createHttpLink, defaultOptions } from "./links"

/** What a call hands its client: the abort signal SWR gave the fetcher. */
interface CreateApolloClientOptions {
    readonly signal?: AbortSignal | undefined
}

/**
 * The one Apollo client of every GraphQL operation (Essentials, Premium and whatever follows): the locale header, the Bearer access token, then the
 * HTTP link to the back end api, where the access token authenticates a signed-in reader and a public read needs none. Nothing is
 * cached here (SWR is the only cache), so a client lives for one call and shares no transport state.
 */
export const createApolloClient = ({ signal }: CreateApolloClientOptions = {}): ApolloClient =>
    new ApolloClient({
        link: ApolloLink.from([createAttachLocaleLink(), createAttachTokenLink(), createHttpLink(signal)]),
        cache: new InMemoryCache(),
        defaultOptions,
    })
