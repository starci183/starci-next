import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    OpenCourseSolutionInput,
    OpenCourseSolutionMutation,
    OpenCourseSolutionMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<OpenCourseSolutionMutation, OpenCourseSolutionMutationVariables> = gql`
    mutation OpenCourseSolution($input: OpenCourseSolutionInput!) {
        openCourseSolution(input: $input) {
            caseId
            revealed
        }
    }
`

/** Params of {@link mutateOpenCourseSolution}. */
interface MutateOpenCourseSolutionParams {
    readonly request: OpenCourseSolutionInput
    readonly signal?: AbortSignal | undefined
}

/** Records that the learner opened a case's solution, so its fix is revealed (the back end `openCourseSolution` mutation). */
export const mutateOpenCourseSolution = async ({
    request,
    signal,
}: MutateOpenCourseSolutionParams): Promise<ApolloClient.MutateResult<OpenCourseSolutionMutation>> => {
    const variables: InputVariables<OpenCourseSolutionInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
