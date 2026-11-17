import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    StartInterviewInput,
    StartInterviewMutation,
    StartInterviewMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<StartInterviewMutation, StartInterviewMutationVariables> = gql`
    mutation StartInterview($input: StartInterviewInput!) {
        startInterview(input: $input) {
            sessionId
            setup {
                track
                tier
                locale
                language
                length
                access
            }
            status
            position
            questions {
                position
                family
                tier
                kind
                bankTitle
                prompt
                givenCode
                diagram
                bodyLanguage
                hintCount
            }
            turns {
                turnId
                position
                role
                kind
                content
                revision
                createdAt
            }
            scorecard {
                overallScore
                verdict
                technicalScore
                technicalVerdict
                behavioralScore
                behavioralVerdict
                attributes {
                    key
                    score
                }
                questions {
                    position
                    questionId
                    family
                    skipped
                    score
                    hintsUsed
                    hintPenalty
                    criticalMissed
                    checklist {
                        text
                        dimension
                        critical
                        scoreBand
                        hit
                        evidenceQuote
                    }
                    dimensions {
                        key
                        text
                        level
                        evidenceQuote
                    }
                    ownershipWeak
                    note
                    idealAnswer
                }
                strengths
                gaps {
                    text
                    position
                    moduleRefs
                }
            }
            lessons {
                moduleRef
                lessons {
                    lessonId
                    title
                }
            }
            gradedBy {
                profile
                model
                usedFallback
            }
            failureCode
            startedAt
            gradedAt
        }
    }
`

/** Starts a session; it makes no AI call. */
export const mutateStartInterview = async ({
    request,
    signal,
}: OperationParams<StartInterviewInput>): Promise<ApolloClient.MutateResult<StartInterviewMutation>> => {
    const variables: InputVariables<StartInterviewInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
