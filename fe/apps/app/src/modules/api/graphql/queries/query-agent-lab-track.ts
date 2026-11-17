import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { AgentLabTrackInput, AgentLabTrackQuery, AgentLabTrackQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<AgentLabTrackQuery, AgentLabTrackQueryVariables> = gql`
    query AgentLabTrack($input: AgentLabTrackInput!) {
        agentLabTrack(input: $input) {
            id
            label
            focus
            keyMode
            pinnedVersion
            labCount
            openLabCount
            cells {
                conceptId
                conceptLabel
                labId
                status
                title
                locked
                open
                steps {
                    text
                    sourceUrl
                }
            }
        }
    }
`

/** The request of a track page: the track and the locale of the copy. */
type QueryAgentLabTrackRequest = AgentLabTrackInput

/** Reads one tool track with the grid of its labs (the back end `agentLabTrack` query). An unknown track rejects with AGENT_LAB_TRACK_NOT_FOUND. */
export const queryAgentLabTrack = async ({
    request,
    signal,
}: QueryParams<QueryAgentLabTrackRequest>): Promise<ApolloClient.QueryResult<AgentLabTrackQuery>> => {
    const variables: InputVariables<QueryAgentLabTrackRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
