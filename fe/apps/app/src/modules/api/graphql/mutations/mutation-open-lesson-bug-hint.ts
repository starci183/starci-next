import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    OpenLessonBugHintInput,
    OpenLessonBugHintMutation,
    OpenLessonBugHintMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<OpenLessonBugHintMutation, OpenLessonBugHintMutationVariables> = gql`
    mutation OpenLessonBugHint($input: OpenLessonBugHintInput!) {
        openLessonBugHint(input: $input) {
            testId
            status
            isLocked
            at
            received
            output
            pass
            fail
            hints
            hintsOpened
            hintCount
        }
    }
`

/** Params of {@link mutateOpenLessonBugHint}. */
interface MutateOpenLessonBugHintParams {
    readonly request: OpenLessonBugHintInput
    readonly signal?: AbortSignal | undefined
}

/** Opens the next hint of a red Tìm sạn test and records it (the back end `openLessonBugHint` mutation). */
export const mutateOpenLessonBugHint = async ({
    request,
    signal,
}: MutateOpenLessonBugHintParams): Promise<ApolloClient.MutateResult<OpenLessonBugHintMutation>> => {
    const variables: InputVariables<OpenLessonBugHintInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
