import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RevealLessonHintInput,
    RevealLessonHintMutation,
    RevealLessonHintMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RevealLessonHintMutation, RevealLessonHintMutationVariables> = gql`
    mutation RevealLessonHint($input: RevealLessonHintInput!) {
        revealLessonHint(input: $input) {
            scenarioId
            hint
        }
    }
`

/** Params of {@link mutateRevealLessonHint}. */
interface MutateRevealLessonHintParams {
    readonly request: RevealLessonHintInput
    readonly signal?: AbortSignal | undefined
}

/** Opens the hint of a scenario and records that the lesson was done "có hỗ trợ" (the back end `revealLessonHint` mutation). */
export const mutateRevealLessonHint = async ({
    request,
    signal,
}: MutateRevealLessonHintParams): Promise<ApolloClient.MutateResult<RevealLessonHintMutation>> => {
    const variables: InputVariables<RevealLessonHintInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
