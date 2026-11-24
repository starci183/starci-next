import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CourseLabInput, StartCourseLabMutation, StartCourseLabMutationVariables } from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<StartCourseLabMutation, StartCourseLabMutationVariables> = gql`
    mutation StartCourseLab($input: CourseLabInput!) {
        startCourseLab(input: $input) {
            action
            device
            manifestId
        }
    }
`

/** Params of {@link mutateStartCourseLab}. */
interface MutateStartCourseLabParams {
    readonly request: CourseLabInput
    readonly signal?: AbortSignal | undefined
}

/** Asks the learner's machine to boot the lab of one lesson (the back end `startCourseLab` mutation). */
export const mutateStartCourseLab = async ({
    request,
    signal,
}: MutateStartCourseLabParams): Promise<ApolloClient.MutateResult<StartCourseLabMutation>> => {
    const variables: InputVariables<CourseLabInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
