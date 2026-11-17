import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MyPremiumQuery, MyPremiumQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<MyPremiumQuery, MyPremiumQueryVariables>

const query1: Document = gql`
    query MyPremium {
        myPremium {
            isPremium
            premiumUntil
            lastRail
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryMyPremiumParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the signed-in reader's Premium entitlement; without a session the back end rejects with IDENTITY_SESSION_REQUIRED. */
export const queryMyPremium = async ({ signal }: QueryMyPremiumParams = {}): Promise<
    ApolloClient.QueryResult<MyPremiumQuery>
> => createApolloClient({ signal }).query({ query: query1 })
