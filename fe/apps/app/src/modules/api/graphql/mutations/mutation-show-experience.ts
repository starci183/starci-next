import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ShowExperienceInput,
    ShowExperienceMutation,
    ShowExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<ShowExperienceMutation, ShowExperienceMutationVariables> = gql`
    mutation ShowExperience($input: ShowExperienceInput!) {
        showExperience(input: $input) {
            itemId
            shownPublicly
        }
    }
`

/** Shows or hides a verified item on the public profile. */
export const mutateShowExperience = async ({
    request,
    signal,
}: QueryParams<ShowExperienceInput>): Promise<ApolloClient.MutateResult<ShowExperienceMutation>> => {
    const variables: InputVariables<ShowExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
