import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    CheckRecallClozeInput,
    CheckReviewClozeMutation,
    CheckReviewClozeMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<CheckReviewClozeMutation, CheckReviewClozeMutationVariables> = gql`
    mutation CheckReviewCloze($input: CheckRecallClozeInput!) {
        checkReviewCloze(input: $input) {
            correct
        }
    }
`

/** The input of the checkReviewCloze mutation. */
type MutateCheckReviewClozeRequest = CheckRecallClozeInput

/** Params of {@link mutateCheckReviewCloze}. */
interface MutateCheckReviewClozeParams {
    readonly request: MutateCheckReviewClozeRequest
    readonly signal?: AbortSignal | undefined
}

/** Checks one picked cloze term; deterministic, no AI. */
export const mutateCheckReviewCloze = async ({
    request,
    signal,
}: MutateCheckReviewClozeParams): Promise<ApolloClient.MutateResult<CheckReviewClozeMutation>> => {
    const variables: InputVariables<MutateCheckReviewClozeRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
