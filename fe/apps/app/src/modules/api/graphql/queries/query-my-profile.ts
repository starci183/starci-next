import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MyProfileQuery, MyProfileQueryVariables, ProfileInput } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<MyProfileQuery, MyProfileQueryVariables> = gql`
    query MyProfile($input: ProfileInput!) {
        myProfile(input: $input) {
            displayName
            avatarUrl
            avatarUpdatedAt
            goal {
                pathId
                title
            }
            limits {
                maxBytes
                contentTypes
                nameMax
            }
        }
    }
`

/** The request of the profile read: the locale of the goal title. */
type QueryMyProfileRequest = ProfileInput

/** Reads the profile of the signed-in learner: the name, the avatar address, the goal path and the avatar limits (the back end `myProfile` query). */
export const queryMyProfile = async ({
    request,
    signal,
}: QueryParams<QueryMyProfileRequest>): Promise<ApolloClient.QueryResult<MyProfileQuery>> => {
    const variables: InputVariables<QueryMyProfileRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
