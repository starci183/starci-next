import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { PremiumOrderQuery, PremiumOrderQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<PremiumOrderQuery, PremiumOrderQueryVariables>

const query1: Document = gql`
    query PremiumOrder($input: PremiumOrderInput!) {
        premiumOrder(input: $input) {
            orderId
            status
            plan
            amountVnd
            rail
            orderCode
            premiumUntil
        }
    }
`

/** What the order read takes: the order to read and the abort signal SWR hands the fetcher. */
interface QueryPremiumOrderParams {
    readonly orderId: string
    readonly signal?: AbortSignal | undefined
}

/** Reads one of the reader's Premium orders; the status is the server's, never derived from the return address. */
export const queryPremiumOrder = async ({
    orderId,
    signal,
}: QueryPremiumOrderParams): Promise<ApolloClient.QueryResult<PremiumOrderQuery>> =>
    createApolloClient({ signal }).query({ query: query1, variables: { input: { orderId } } })
