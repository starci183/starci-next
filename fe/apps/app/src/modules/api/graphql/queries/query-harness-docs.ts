import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessLocaleInput, HarnessDocsQuery, HarnessDocsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessDocsQuery, HarnessDocsQueryVariables> = gql`
    query HarnessDocs($input: HarnessLocaleInput!) {
        harnessDocs(input: $input) {
            slug
            order
            title
            summary
        }
    }
`

/** Reads the articles of part 3 (the back end `harnessDocs` query). */
export const queryHarnessDocs = async ({
    request,
    signal,
}: QueryParams<HarnessLocaleInput>): Promise<ApolloClient.QueryResult<HarnessDocsQuery>> => {
    const variables: InputVariables<HarnessLocaleInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
