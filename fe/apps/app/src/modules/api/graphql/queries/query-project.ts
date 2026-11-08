import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ProjectInput, ProjectQuery, ProjectQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectQuery, ProjectQueryVariables> = gql`
    query Project($input: ProjectInput!) {
        project(input: $input) {
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
            milestones {
                id
                title
                conceptCount
                provedCount
                state
                locked
            }
            practisingConceptCount
            lastCiRun {
                runId
                commit
                passed
                at
            }
            lastProbeRun {
                runId
                url
                passed
                at
                results {
                    probeId
                    conceptId
                    passed
                    reason
                    facts {
                        key
                        value
                    }
                }
            }
        }
    }
`

/** Reads one project with its milestones, practice and proof (the back end `project` query). */
export const queryProject = async ({
    request,
    signal,
}: QueryParams<ProjectInput>): Promise<ApolloClient.QueryResult<ProjectQuery>> => {
    const variables: InputVariables<ProjectInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
