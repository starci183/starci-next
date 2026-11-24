import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    CourseLabInput,
    RunCourseLabTestsMutation,
    RunCourseLabTestsMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RunCourseLabTestsMutation, RunCourseLabTestsMutationVariables> = gql`
    mutation RunCourseLabTests($input: CourseLabInput!) {
        runCourseLabTests(input: $input) {
            action
            device
            manifestId
        }
    }
`

/** Params of {@link mutateRunCourseLabTests}. */
interface MutateRunCourseLabTestsParams {
    readonly request: CourseLabInput
    readonly signal?: AbortSignal | undefined
}

/** Asks the learner's machine to run the visible tests of the lab (the back end `runCourseLabTests` mutation). */
export const mutateRunCourseLabTests = async ({
    request,
    signal,
}: MutateRunCourseLabTestsParams): Promise<ApolloClient.MutateResult<RunCourseLabTestsMutation>> => {
    const variables: InputVariables<CourseLabInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
