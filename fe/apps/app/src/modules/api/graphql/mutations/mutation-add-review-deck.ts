import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallDeckInput, AddReviewDeckMutation, AddReviewDeckMutationVariables } from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<AddReviewDeckMutation, AddReviewDeckMutationVariables> = gql`
    mutation AddReviewDeck($input: RecallDeckInput!) {
        addReviewDeck(input: $input) {
            deckId
            added
            newCards
        }
    }
`

/** The input of the addReviewDeck mutation. */
type MutateAddReviewDeckRequest = RecallDeckInput

/** Params of {@link mutateAddReviewDeck}. */
interface MutateAddReviewDeckParams {
    readonly request: MutateAddReviewDeckRequest
    readonly signal?: AbortSignal | undefined
}

/** Adds a deck to the learner's review. */
export const mutateAddReviewDeck = async ({
    request,
    signal,
}: MutateAddReviewDeckParams): Promise<ApolloClient.MutateResult<AddReviewDeckMutation>> => {
    const variables: InputVariables<MutateAddReviewDeckRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
