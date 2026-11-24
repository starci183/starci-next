import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    OpenCourseHintInput,
    OpenCourseHintMutation,
    OpenCourseHintMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<OpenCourseHintMutation, OpenCourseHintMutationVariables> = gql`
    mutation OpenCourseHint($input: OpenCourseHintInput!) {
        openCourseHint(input: $input) {
            caseId
            level
            text
        }
    }
`

/** Params of {@link mutateOpenCourseHint}. */
interface MutateOpenCourseHintParams {
    readonly request: OpenCourseHintInput
    readonly signal?: AbortSignal | undefined
}

/** Opens one level of a case's hint ladder and answers its text (the back end `openCourseHint` mutation). */
export const mutateOpenCourseHint = async ({
    request,
    signal,
}: MutateOpenCourseHintParams): Promise<ApolloClient.MutateResult<OpenCourseHintMutation>> => {
    const variables: InputVariables<OpenCourseHintInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
