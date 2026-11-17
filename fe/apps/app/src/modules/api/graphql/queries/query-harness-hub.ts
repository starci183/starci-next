import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessLocaleInput, HarnessHubQuery, HarnessHubQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessHubQuery, HarnessHubQueryVariables> = gql`
    query HarnessHub($input: HarnessLocaleInput!) {
        harnessHub(input: $input) {
            parts {
                key
                order
                title
                summary
                total
                practising
                proved
                done
                nextId
            }
        }
    }
`

/** Reads the three parts of /harness with the learner counts (the back end `harnessHub` query). */
export const queryHarnessHub = async ({
    request,
    signal,
}: QueryParams<HarnessLocaleInput>): Promise<ApolloClient.QueryResult<HarnessHubQuery>> => {
    const variables: InputVariables<HarnessLocaleInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
