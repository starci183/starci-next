import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    GradeRecallCardInput,
    GradeReviewCardMutation,
    GradeReviewCardMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<GradeReviewCardMutation, GradeReviewCardMutationVariables> = gql`
    mutation GradeReviewCard($input: GradeRecallCardInput!) {
        gradeReviewCard(input: $input) {
            itemId
            status
            step
            dueOn
            remainingToday
            goal {
                daily
                done
            }
        }
    }
`

/** The input of the gradeReviewCard mutation. */
type MutateGradeReviewCardRequest = GradeRecallCardInput

/** Params of {@link mutateGradeReviewCard}. */
interface MutateGradeReviewCardParams {
    readonly request: MutateGradeReviewCardRequest
    readonly signal?: AbortSignal | undefined
}

/** Stores the self-grade of a revealed item and schedules its next review. */
export const mutateGradeReviewCard = async ({
    request,
    signal,
}: MutateGradeReviewCardParams): Promise<ApolloClient.MutateResult<GradeReviewCardMutation>> => {
    const variables: InputVariables<MutateGradeReviewCardRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
