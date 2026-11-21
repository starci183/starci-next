import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ViewerRolesQuery, ViewerRolesQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<ViewerRolesQuery, ViewerRolesQueryVariables>

const query1: Document = gql`
    query ViewerRoles {
        viewerRoles
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryViewerRolesParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the roles (teacher, reviewer) of the signed-in account; without a session the back end rejects with IDENTITY_UNAUTHENTICATED. */
export const queryViewerRoles = async ({ signal }: QueryViewerRolesParams = {}): Promise<
    ApolloClient.QueryResult<ViewerRolesQuery>
> => createApolloClient({ signal }).query({ query: query1 })
