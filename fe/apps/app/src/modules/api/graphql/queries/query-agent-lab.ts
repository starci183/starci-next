import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { AgentLabInput, AgentLabQuery, AgentLabQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<AgentLabQuery, AgentLabQueryVariables> = gql`
    query AgentLab($input: AgentLabInput!) {
        agentLab(input: $input) {
            tracks {
                id
                label
                focus
                keyMode
                pinnedVersion
                labCount
                openLabCount
            }
            concepts {
                id
                label
                evidence
                free
            }
        }
    }
`

/** The request of the lab area overview: the locale of the copy. */
type QueryAgentLabRequest = AgentLabInput

/** Reads the tracks and the seven mindset concepts of the agent lab (the back end `agentLab` query). */
export const queryAgentLab = async ({
    request,
    signal,
}: QueryParams<QueryAgentLabRequest>): Promise<ApolloClient.QueryResult<AgentLabQuery>> => {
    const variables: InputVariables<QueryAgentLabRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
