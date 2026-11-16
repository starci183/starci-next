import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessTrialsInput, HarnessTrialsQuery, HarnessTrialsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessTrialsQuery, HarnessTrialsQueryVariables> = gql`
    query HarnessTrials($input: HarnessTrialsInput!) {
        harnessTrials(input: $input) {
            id
            order
            title
            task
            tools
            estimate {
                turns
                outputTokensPerTurn
            }
            last {
                tool
                verdict
                testsGreen
                shortcuts {
                    kind
                    blocked
                }
                at
            }
        }
    }
`

/** Reads the traps of the trial panel with the newest result of each (the back end `harnessTrials` query). */
export const queryHarnessTrials = async ({
    request,
    signal,
}: QueryParams<HarnessTrialsInput>): Promise<ApolloClient.QueryResult<HarnessTrialsQuery>> => {
    const variables: InputVariables<HarnessTrialsInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
