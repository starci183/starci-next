import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewSessionRefInput,
    InterviewSessionQuery,
    InterviewSessionQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const document: TypedDocumentNode<InterviewSessionQuery, InterviewSessionQueryVariables> = gql`
    query InterviewSession($input: InterviewSessionRefInput!) {
        interviewSession(input: $input) {
            sessionId
            previousScore
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
                    topic
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

/** Reads one interview session; the scorecard appears only once it is graded. */
export const queryInterviewSession = async ({
    request,
    signal,
}: QueryParams<InterviewSessionRefInput>): Promise<ApolloClient.QueryResult<InterviewSessionQuery>> => {
    const variables: InputVariables<InterviewSessionRefInput> = { input: request }
    return createApolloClient({ signal }).query({ query: document, variables })
}
