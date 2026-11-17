import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessGuidesInput, HarnessGuidesQuery, HarnessGuidesQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessGuidesQuery, HarnessGuidesQueryVariables> = gql`
    query HarnessGuides($input: HarnessGuidesInput!) {
        harnessGuides(input: $input) {
            tool
            slug
            order
            title
            summary
        }
    }
`

/** Reads the guides of one tool (the back end `harnessGuides` query). */
export const queryHarnessGuides = async ({
    request,
    signal,
}: QueryParams<HarnessGuidesInput>): Promise<ApolloClient.QueryResult<HarnessGuidesQuery>> => {
    const variables: InputVariables<HarnessGuidesInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
