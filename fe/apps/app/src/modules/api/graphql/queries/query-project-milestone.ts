import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ProjectMilestoneInput,
    ProjectMilestoneQuery,
    ProjectMilestoneQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectMilestoneQuery, ProjectMilestoneQueryVariables> = gql`
    query ProjectMilestone($input: ProjectMilestoneInput!) {
        projectMilestone(input: $input) {
            project {
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
            milestone {
                id
                title
                conceptCount
                provedCount
                state
                locked
            }
            concepts {
                id
                label
                kind
                state
                comingSoon
                lesson {
                    id
                    topicId
                    title
                }
                location
                endpoint
                sampleBody
                slots {
                    slot
                    required
                    state
                    proof
                    source
                    ref
                    at
                }
                failing {
                    slot
                    probeId
                    reason
                    facts {
                        key
                        value
                    }
                    question
                }
                aiQuestion
            }
        }
    }
`

/** Reads the concept checklist of one milestone of a project (the back end `projectMilestone` query). */
export const queryProjectMilestone = async ({
    request,
    signal,
}: QueryParams<ProjectMilestoneInput>): Promise<ApolloClient.QueryResult<ProjectMilestoneQuery>> => {
    const variables: InputVariables<ProjectMilestoneInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
