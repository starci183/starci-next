import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { PracticeSolveInput, RunPracticeMutation, RunPracticeMutationVariables } from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RunPracticeMutation, RunPracticeMutationVariables> = gql`
    mutation RunPractice($input: PracticeSolveInput!) {
        runPractice(input: $input) {
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

/** The input of the runPractice mutation. */
type MutateRunPracticeRequest = PracticeSolveInput

/** Params of {@link mutateRunPractice}. */
interface MutateRunPracticeParams {
    readonly request: MutateRunPracticeRequest
    readonly signal?: AbortSignal | undefined
}

/** Queues a run of the code on the problem's example tests only; the answer is the queued submission to poll. */
export const mutateRunPractice = async ({
    request,
    signal,
}: MutateRunPracticeParams): Promise<ApolloClient.MutateResult<RunPracticeMutation>> => {
    const variables: InputVariables<MutateRunPracticeRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
