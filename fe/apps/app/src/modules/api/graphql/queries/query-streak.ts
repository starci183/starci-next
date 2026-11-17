import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { StreakQuery, StreakQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<StreakQuery, StreakQueryVariables>

const query1: Document = gql`
    query Streak {
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
            reminder {
                enabled
                localTime
            }
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryStreakParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the one streak of the signed-in learner (the back end `streak` query); the header chip uses it. */
export const queryStreak = async ({ signal }: QueryStreakParams = {}): Promise<ApolloClient.QueryResult<StreakQuery>> =>
    createApolloClient({ signal }).query({ query: query1 })
