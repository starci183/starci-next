import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessDocInput, HarnessDocQuery, HarnessDocQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessDocQuery, HarnessDocQueryVariables> = gql`
    query HarnessDoc($input: HarnessDocInput!) {
        harnessDoc(input: $input) {
            slug
            order
            title
            summary
            sections {
                id
                order
                title
                body
                run
            }
        }
    }
`

/** Reads one article with its sections (the back end `harnessDoc` query). */
export const queryHarnessDoc = async ({
    request,
    signal,
}: QueryParams<HarnessDocInput>): Promise<ApolloClient.QueryResult<HarnessDocQuery>> => {
    const variables: InputVariables<HarnessDocInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
