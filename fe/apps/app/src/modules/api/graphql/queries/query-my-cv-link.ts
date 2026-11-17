import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MyCvLinkQuery, MyCvLinkQueryVariables } from "../__generated__/graphql"

const query1: TypedDocumentNode<MyCvLinkQuery, MyCvLinkQueryVariables> = gql`
    query MyCvLink {
        myCvLink {
            slug
            path
            isPublic
            verifiedCount
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryMyCvLinkParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the address of the public CV of the signed-in learner, whether it is public and how many verified lines it holds. */
export const queryMyCvLink = async ({ signal }: QueryMyCvLinkParams = {}): Promise<
    ApolloClient.QueryResult<MyCvLinkQuery>
> => createApolloClient({ signal }).query({ query: query1, fetchPolicy: "no-cache" })
