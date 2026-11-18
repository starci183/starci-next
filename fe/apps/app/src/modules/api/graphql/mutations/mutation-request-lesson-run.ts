import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RequestLessonRunInput,
    RequestLessonRunMutation,
    RequestLessonRunMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RequestLessonRunMutation, RequestLessonRunMutationVariables> = gql`
    mutation RequestLessonRun($input: RequestLessonRunInput!) {
        requestLessonRun(input: $input) {
            device
            command
            manifestId
        }
    }
`

/** Params of {@link mutateRequestLessonRun}. */
interface MutateRequestLessonRunParams {
    readonly request: RequestLessonRunInput
    readonly signal?: AbortSignal | undefined
}

/** Asks the learner's online machine to run one scenario (the back end `requestLessonRun` mutation). */
export const mutateRequestLessonRun = async ({
    request,
    signal,
}: MutateRequestLessonRunParams): Promise<ApolloClient.MutateResult<RequestLessonRunMutation>> => {
    const variables: InputVariables<RequestLessonRunInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
