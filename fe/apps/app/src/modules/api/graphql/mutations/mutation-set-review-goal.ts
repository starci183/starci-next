import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetRecallGoalInput,
    SetReviewGoalMutation,
    SetReviewGoalMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SetReviewGoalMutation, SetReviewGoalMutationVariables> = gql`
    mutation SetReviewGoal($input: SetRecallGoalInput!) {
        setReviewGoal(input: $input) {
            daily
        }
    }
`

/** The input of the setReviewGoal mutation. */
type MutateSetReviewGoalRequest = SetRecallGoalInput

/** Params of {@link mutateSetReviewGoal}. */
interface MutateSetReviewGoalParams {
    readonly request: MutateSetReviewGoalRequest
    readonly signal?: AbortSignal | undefined
}

/** Sets the daily review goal (5 to 50 items). */
export const mutateSetReviewGoal = async ({
    request,
    signal,
}: MutateSetReviewGoalParams): Promise<ApolloClient.MutateResult<SetReviewGoalMutation>> => {
    const variables: InputVariables<MutateSetReviewGoalRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
