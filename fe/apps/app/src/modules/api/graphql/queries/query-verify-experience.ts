import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    VerifyExperienceInput,
    VerifyExperienceQuery,
    VerifyExperienceQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<VerifyExperienceQuery, VerifyExperienceQueryVariables> = gql`
    query VerifyExperience($input: VerifyExperienceInput!) {
        verifyExperience(input: $input) {
            code
            itemType
            part
            line {
                vi
                en
            }
            state
            signerRole
            signedAt
            revokedAt
            evidenceKinds
        }
    }
`

/** Reads the public verification of one item; no session is needed. */
export const queryVerifyExperience = async ({
    request,
    signal,
}: QueryParams<VerifyExperienceInput>): Promise<ApolloClient.QueryResult<VerifyExperienceQuery>> => {
    const variables: InputVariables<VerifyExperienceInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
