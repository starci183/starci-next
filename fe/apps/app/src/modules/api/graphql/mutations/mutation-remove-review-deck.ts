import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RecallDeckInput,
    RemoveReviewDeckMutation,
    RemoveReviewDeckMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RemoveReviewDeckMutation, RemoveReviewDeckMutationVariables> = gql`
    mutation RemoveReviewDeck($input: RecallDeckInput!) {
        removeReviewDeck(input: $input) {
            deckId
            added
            suspended
        }
    }
`

/** The input of the removeReviewDeck mutation. */
type MutateRemoveReviewDeckRequest = RecallDeckInput

/** Params of {@link mutateRemoveReviewDeck}. */
interface MutateRemoveReviewDeckParams {
    readonly request: MutateRemoveReviewDeckRequest
    readonly signal?: AbortSignal | undefined
}

/** Removes a deck from the learner's review and suspends its items. */
export const mutateRemoveReviewDeck = async ({
    request,
    signal,
}: MutateRemoveReviewDeckParams): Promise<ApolloClient.MutateResult<RemoveReviewDeckMutation>> => {
    const variables: InputVariables<MutateRemoveReviewDeckRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
