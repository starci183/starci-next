import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessLocaleInput, HarnessBuildsQuery, HarnessBuildsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessBuildsQuery, HarnessBuildsQueryVariables> = gql`
    query HarnessBuilds($input: HarnessLocaleInput!) {
        harnessBuilds(input: $input) {
            id
            order
            title
            summary
            keys {
                id
                anyOf
                note
            }
            stageCount
            practisingStages
            provedStages
            state
        }
    }
`

/** Reads the builds of part 1 with their progress (the back end `harnessBuilds` query). */
export const queryHarnessBuilds = async ({
    request,
    signal,
}: QueryParams<HarnessLocaleInput>): Promise<ApolloClient.QueryResult<HarnessBuildsQuery>> => {
    const variables: InputVariables<HarnessLocaleInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
