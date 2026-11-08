import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SubmitExperienceInput,
    SubmitExperienceMutation,
    SubmitExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<SubmitExperienceMutation, SubmitExperienceMutationVariables> = gql`
    mutation SubmitExperience($input: SubmitExperienceInput!) {
        submitExperience(input: $input) {
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
`

/** Sends an item to pending review with the learner's line. */
export const mutateSubmitExperience = async ({
    request,
    signal,
}: QueryParams<SubmitExperienceInput>): Promise<ApolloClient.MutateResult<SubmitExperienceMutation>> => {
    const variables: InputVariables<SubmitExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
