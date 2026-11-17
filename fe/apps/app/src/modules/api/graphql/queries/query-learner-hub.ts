import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LearnerHubInput, LearnerHubQuery, LearnerHubQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LearnerHubQuery, LearnerHubQueryVariables> = gql`
    query LearnerHub($input: LearnerHubInput!) {
        learnerHub(input: $input) {
            activePath {
                pathId
                title
                next
            }
            today {
                shard
                kind
                title
                link
                dueAt
            }
            streak {
                current
                longest
                todayCounted
                week {
                    activeDays
                    goal
                }
                freezes {
                    held
                }
                days {
                    day
                    counted
                    freezeUsed
                    shards
                }
            }
            shards {
                shard
                order
                label
                route
                status
                progress {
                    label
                    value
                    total
                }
                counter {
                    current
                    longest
                }
                activeDaysLast30
                todayCounted
                experience {
                    verified
                    pending
                }
                unavailable
            }
            layers {
                id
                label
                route
            }
        }
    }
`

/** The request of the hub: the locale of the labels. */
type QueryLearnerHubRequest = LearnerHubInput

/** Reads the learn hub: the active path, today's actions, the streak, the six shards and the three layers (the back end `learnerHub` query). */
export const queryLearnerHub = async ({
    request,
    signal,
}: QueryParams<QueryLearnerHubRequest>): Promise<ApolloClient.QueryResult<LearnerHubQuery>> => {
    const variables: InputVariables<QueryLearnerHubRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
