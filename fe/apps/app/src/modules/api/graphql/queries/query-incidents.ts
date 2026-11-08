import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { IncidentsInput, IncidentsQuery, IncidentsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<IncidentsQuery, IncidentsQueryVariables> = gql`
    query Incidents($input: IncidentsInput!) {
        incidents(input: $input) {
            lessonId
            title
            topicId
            topicTitle
            group
            difficulty
            minutes
            incidentAvailable
            status
        }
    }
`

/** The request of the incident list: the locale of the titles and an optional topic. */
type QueryIncidentsRequest = IncidentsInput

/** Reads the live Essentials lessons with whether their tier-2 incident is written (the back end `incidents` query). */
export const queryIncidents = async ({
    request,
    signal,
}: QueryParams<QueryIncidentsRequest>): Promise<ApolloClient.QueryResult<IncidentsQuery>> => {
    const variables: InputVariables<QueryIncidentsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
