import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MyExperienceInput, MyExperienceQuery, MyExperienceQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<MyExperienceQuery, MyExperienceQueryVariables> = gql`
    query MyExperience($input: MyExperienceInput!) {
        myExperience(input: $input) {
            hiringMinVerified
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
            }
        }
    }
`

/** Reads the signed-in learner's experience items, newest change first (contract.career.api experience). */
export const queryMyExperience = async ({
    request,
    signal,
}: QueryParams<MyExperienceInput>): Promise<ApolloClient.QueryResult<MyExperienceQuery>> => {
    const variables: InputVariables<MyExperienceInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
