import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ReviewItemInput, ReviewItemQuery, ReviewItemQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewItemQuery, ReviewItemQueryVariables> = gql`
    query ReviewItem($input: ReviewItemInput!) {
        reviewItem(input: $input) {
            item {
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
            history {
                action
                actorRole
                fromState
                toState
                note
                at
            }
        }
    }
`

/** Reads one item under review with its audit trail. */
export const queryReviewItem = async ({
    request,
    signal,
}: QueryParams<ReviewItemInput>): Promise<ApolloClient.QueryResult<ReviewItemQuery>> => {
    const variables: InputVariables<ReviewItemInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
