import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SubmitCourseLabInput,
    SubmitCourseLabMutation,
    SubmitCourseLabMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SubmitCourseLabMutation, SubmitCourseLabMutationVariables> = gql`
    mutation SubmitCourseLab($input: SubmitCourseLabInput!) {
        submitCourseLab(input: $input) {
            action
            device
            manifestId
            submissionId
        }
    }
`

/** Params of {@link mutateSubmitCourseLab}. */
interface MutateSubmitCourseLabParams {
    readonly request: SubmitCourseLabInput
    readonly signal?: AbortSignal | undefined
}

/** Submits the lab so the learner's machine grades it (the back end `submitCourseLab` mutation). */
export const mutateSubmitCourseLab = async ({
    request,
    signal,
}: MutateSubmitCourseLabParams): Promise<ApolloClient.MutateResult<SubmitCourseLabMutation>> => {
    const variables: InputVariables<SubmitCourseLabInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
