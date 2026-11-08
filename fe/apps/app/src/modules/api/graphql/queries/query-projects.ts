import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ProjectsInput, ProjectsQuery, ProjectsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectsQuery, ProjectsQueryVariables> = gql`
    query Projects($input: ProjectsInput!) {
        projects(input: $input) {
            id
            name
            kind
            topic
            language
            stack
            track
            repoUrl
            deployedUrl
            provedConceptCount
            conceptCount
            currentMilestoneId
            doneMilestoneCount
            milestoneCount
            createdAt
        }
    }
`

/** Lists the signed-in learner's projects with their progress (the back end `projects` query). */
export const queryProjects = async ({
    request,
    signal,
}: QueryParams<ProjectsInput>): Promise<ApolloClient.QueryResult<ProjectsQuery>> => {
    const variables: InputVariables<ProjectsInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
