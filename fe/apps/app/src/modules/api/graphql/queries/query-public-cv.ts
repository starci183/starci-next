import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { PublicCvInput, PublicCvQuery, PublicCvQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

/** The public CV document, shared by the browser read and the server read behind the page metadata. */
export const publicCvDocument: TypedDocumentNode<PublicCvQuery, PublicCvQueryVariables> = gql`
    query PublicCv($input: PublicCvInput!) {
        publicCv(input: $input) {
            displayName
            avatarUrl
            lines {
                line
                source
                signedAt
                verificationCode
                signerRole
                subject
                evidence {
                    kind
                    count
                }
            }
        }
    }
`

/** The request of the public CV read: the slug of the link and the locale of the lines. */
type QueryPublicCvRequest = PublicCvInput

/** Reads the public CV behind one link: the name, the avatar and the verified lines the learner chose to show. */
export const queryPublicCv = async ({
    request,
    signal,
}: QueryParams<QueryPublicCvRequest>): Promise<ApolloClient.QueryResult<PublicCvQuery>> => {
    const variables: InputVariables<QueryPublicCvRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: publicCvDocument, variables, fetchPolicy: "no-cache" })
}
