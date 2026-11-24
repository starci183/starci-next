import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    StartCourseLabInput,
    StartCourseLabMutation,
    StartCourseLabMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<StartCourseLabMutation, StartCourseLabMutationVariables> = gql`
    mutation StartCourseLab($input: StartCourseLabInput!) {
        startCourseLab(input: $input) {
            action
            device
            manifestId
        }
    }
`

/** Params of {@link mutateStartCourseLab}. */
interface MutateStartCourseLabParams {
    readonly request: StartCourseLabInput
    readonly signal?: AbortSignal | undefined
}

/** Asks the learner's machine to boot the lab of one lesson, in the folder the request names when it does (the back end `startCourseLab` mutation). */
export const mutateStartCourseLab = async ({
    request,
    signal,
}: MutateStartCourseLabParams): Promise<ApolloClient.MutateResult<StartCourseLabMutation>> => {
    const variables: InputVariables<StartCourseLabInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
