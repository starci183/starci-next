import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ReviewQueueInput, ReviewQueueQuery, ReviewQueueQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewQueueQuery, ReviewQueueQueryVariables> = gql`
    query ReviewQueue($input: ReviewQueueInput!) {
        reviewQueue(input: $input) {
            role
            counts {
                pending
                overdue
                unassigned
            }
            items {
                itemId
                verificationCode
                itemType
                part
                output
                subject
                state
                line {
                    vi
                    en
                }
                draftLine {
                    vi
                    en
                }
                evidence {
                    kind
                    ref
                    proofForm
                    at
                }
                grade {
                    result
                    criteria {
                        criterion
                        level
                        evidenceQuote
                    }
                }
                returnNote
                returnCount
                dueAt
                signature {
                    role
                    signedAt
                }
                revokedAt
                shownPublicly
                defenseQuestions
                updatedAt
                learnerHandle
                assigneeId
                teacherOnly
                sla
            }
        }
    }
`

/** Reads one tab of the review queue of a teacher or an appointed reviewer (contract.career.api review-queue). */
export const queryReviewQueue = async ({
    request,
    signal,
}: QueryParams<ReviewQueueInput>): Promise<ApolloClient.QueryResult<ReviewQueueQuery>> => {
    const variables: InputVariables<ReviewQueueInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
