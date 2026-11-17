import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticeSolveInput,
    SubmitPracticeMutation,
    SubmitPracticeMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SubmitPracticeMutation, SubmitPracticeMutationVariables> = gql`
    mutation SubmitPractice($input: PracticeSolveInput!) {
        submitPractice(input: $input) {
            id
            slug
            language
            kind
            verdict
            compileOutput
            failureCode
            tests {
                index
                passed
                status
                timeMs
                memoryKb
                example {
                    input
                    expected
                    actual
                }
            }
            passedCount
            totalCount
            timeMs
            memoryKb
        }
    }
`

/** The input of the submitPractice mutation. */
type MutateSubmitPracticeRequest = PracticeSolveInput

/** Params of {@link mutateSubmitPractice}. */
interface MutateSubmitPracticeParams {
    readonly request: MutateSubmitPracticeRequest
    readonly signal?: AbortSignal | undefined
}

/** Queues a submission against every test; hidden tests answer only their status. The answer is the queued submission to poll. */
export const mutateSubmitPractice = async ({
    request,
    signal,
}: MutateSubmitPracticeParams): Promise<ApolloClient.MutateResult<SubmitPracticeMutation>> => {
    const variables: InputVariables<MutateSubmitPracticeRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
