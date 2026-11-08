import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { PremiumPlansQuery, PremiumPlansQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<PremiumPlansQuery, PremiumPlansQueryVariables>

const query1: Document = gql`
    query PremiumPlans {
        premiumPlans {
            plan
            term
            amountVnd
            currency
        }
    }
`

/** What the plans read takes: the abort signal SWR hands the fetcher. */
interface QueryPremiumPlansParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the public Premium plans catalog; the back end owns the offers and their prices (every plan with its term and fixed VND amount). */
export const queryPremiumPlans = async ({ signal }: QueryPremiumPlansParams = {}): Promise<
    ApolloClient.QueryResult<PremiumPlansQuery>
> => createApolloClient({ signal }).query({ query: query1 })
