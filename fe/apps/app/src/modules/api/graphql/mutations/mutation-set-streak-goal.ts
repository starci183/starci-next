import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetStreakGoalInput,
    SetStreakGoalMutation,
    SetStreakGoalMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SetStreakGoalMutation, SetStreakGoalMutationVariables> = gql`
    mutation SetStreakGoal($input: SetStreakGoalInput!) {
        setStreakGoal(input: $input) {
            weeklyGoal
            reminder {
                enabled
                localTime
            }
        }
    }
`

/** The input of the setStreakGoal mutation. */
type MutateSetStreakGoalRequest = SetStreakGoalInput

/** Params of {@link mutateSetStreakGoal}. */
interface MutateSetStreakGoalParams {
    readonly request: MutateSetStreakGoalRequest
    readonly signal?: AbortSignal | undefined
}

/** Sets the weekly goal (2 to 7 active days) and the optional reminder of the streak. */
export const mutateSetStreakGoal = async ({
    request,
    signal,
}: MutateSetStreakGoalParams): Promise<ApolloClient.MutateResult<SetStreakGoalMutation>> => {
    const variables: InputVariables<MutateSetStreakGoalRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
