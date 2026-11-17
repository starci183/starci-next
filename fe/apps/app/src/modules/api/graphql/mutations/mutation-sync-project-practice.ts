import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SyncProjectPracticeInput,
    SyncProjectPracticeMutation,
    SyncProjectPracticeMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<SyncProjectPracticeMutation, SyncProjectPracticeMutationVariables> = gql`
    mutation SyncProjectPractice($input: SyncProjectPracticeInput!) {
        syncProjectPractice(input: $input) {
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

/** Pulls the results the learner machine reported over the relay into a project. */
export const mutateSyncProjectPractice = async ({
    request,
    signal,
}: QueryParams<SyncProjectPracticeInput>): Promise<ApolloClient.MutateResult<SyncProjectPracticeMutation>> => {
    const variables: InputVariables<SyncProjectPracticeInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
