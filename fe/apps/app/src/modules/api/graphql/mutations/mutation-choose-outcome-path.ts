import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ChooseOutcomePathInput,
    ChooseOutcomePathMutation,
    ChooseOutcomePathMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<ChooseOutcomePathMutation, ChooseOutcomePathMutationVariables> = gql`
    mutation ChooseOutcomePath($input: ChooseOutcomePathInput!) {
        chooseOutcomePath(input: $input) {
            activePathId
            chosenAt
        }
    }
`

/** The input of the chooseOutcomePath mutation. */
type MutateChooseOutcomePathRequest = ChooseOutcomePathInput

/** Params of {@link mutateChooseOutcomePath}. */
interface MutateChooseOutcomePathParams {
    readonly request: MutateChooseOutcomePathRequest
    readonly signal?: AbortSignal | undefined
}

/** Sets the outcome path the learner follows. */
export const mutateChooseOutcomePath = async ({
    request,
    signal,
}: MutateChooseOutcomePathParams): Promise<ApolloClient.MutateResult<ChooseOutcomePathMutation>> => {
    const variables: InputVariables<MutateChooseOutcomePathRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
