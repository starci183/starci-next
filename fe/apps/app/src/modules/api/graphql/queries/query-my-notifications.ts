import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MyNotificationsQuery, MyNotificationsQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>

const query1: Document = gql`
    query MyNotifications($input: MyNotificationsInput) {
        myNotifications(input: $input) {
            unreadCount
            nextCursor
            items {
                id
                kind
                link
                isRead
                createdAt
                params {
                    key
                    value
                }
            }
        }
    }
`

/** What the read takes: how many to list and the abort signal SWR hands the fetcher. */
interface QueryMyNotificationsParams {
    readonly limit?: number | undefined
    readonly signal?: AbortSignal | undefined
}

/** Reads the signed-in reader's notifications, newest first, with the unread count; without a session the back end rejects with IDENTITY_SESSION_REQUIRED. */
export const queryMyNotifications = async ({ limit, signal }: QueryMyNotificationsParams = {}): Promise<
    ApolloClient.QueryResult<MyNotificationsQuery>
> =>
    createApolloClient({ signal }).query({ query: query1, variables: { input: { after: null, limit: limit ?? null } } })
