import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    FlipRecallCardInput,
    FlipReviewCardMutation,
    FlipReviewCardMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<FlipReviewCardMutation, FlipReviewCardMutationVariables> = gql`
    mutation FlipReviewCard($input: FlipRecallCardInput!) {
        flipReviewCard(input: $input) {
            itemId
            answer
            revision
            intervals {
                again
                hard
                good
                easy
            }
        }
    }
`

/** The input of the flipReviewCard mutation. */
type MutateFlipReviewCardRequest = FlipRecallCardInput

/** Params of {@link mutateFlipReviewCard}. */
interface MutateFlipReviewCardParams {
    readonly request: MutateFlipReviewCardRequest
    readonly signal?: AbortSignal | undefined
}

/** Reveals the answer of a card with the next interval of each grade. */
export const mutateFlipReviewCard = async ({
    request,
    signal,
}: MutateFlipReviewCardParams): Promise<ApolloClient.MutateResult<FlipReviewCardMutation>> => {
    const variables: InputVariables<MutateFlipReviewCardRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
