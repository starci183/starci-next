import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SubmitRecallRetrievalInput,
    SubmitReviewRetrievalMutation,
    SubmitReviewRetrievalMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SubmitReviewRetrievalMutation, SubmitReviewRetrievalMutationVariables> = gql`
    mutation SubmitReviewRetrieval($input: SubmitRecallRetrievalInput!) {
        submitReviewRetrieval(input: $input) {
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

/** The input of the submitReviewRetrieval mutation. */
type MutateSubmitReviewRetrievalRequest = SubmitRecallRetrievalInput

/** Params of {@link mutateSubmitReviewRetrieval}. */
interface MutateSubmitReviewRetrievalParams {
    readonly request: MutateSubmitReviewRetrievalRequest
    readonly signal?: AbortSignal | undefined
}

/** Stores the written answer of a retrieval item, then reveals the sample answer. */
export const mutateSubmitReviewRetrieval = async ({
    request,
    signal,
}: MutateSubmitReviewRetrievalParams): Promise<ApolloClient.MutateResult<SubmitReviewRetrievalMutation>> => {
    const variables: InputVariables<MutateSubmitReviewRetrievalRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
