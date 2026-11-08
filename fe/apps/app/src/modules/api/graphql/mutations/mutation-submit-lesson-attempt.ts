import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SubmitLessonAttemptInput,
    SubmitLessonAttemptMutation,
    SubmitLessonAttemptMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SubmitLessonAttemptMutation, SubmitLessonAttemptMutationVariables> = gql`
    mutation SubmitLessonAttempt($input: SubmitLessonAttemptInput!) {
        submitLessonAttempt(input: $input) {
            attemptId
            lessonId
            version
            activityId
            revision
            kind
            phase
            status
            failureCode
            submittedAt
            gradedAt
            result {
                correct
                success
                reachedStateId
                score
                maxScore
                isDiagnostic
                options {
                    optionId
                    isCorrect
                    selected
                    explanation
                }
                criteria {
                    criterionId
                    criterion
                    level
                    evidenceQuote
                    maxScore
                }
            }
        }
    }
`

/** The input of the mutation: the lesson version, the activity, the revision and the answer. */
type MutateSubmitLessonAttemptRequest = SubmitLessonAttemptInput

/** Params of {@link mutateSubmitLessonAttempt}. */
interface MutateSubmitLessonAttemptParams {
    readonly request: MutateSubmitLessonAttemptRequest
    readonly signal?: AbortSignal | undefined
}

/** Saves one attempt (the back end `submitLessonAttempt` mutation); a choice or a simulation is graded at once, a written answer later. */
export const mutateSubmitLessonAttempt = async ({
    request,
    signal,
}: MutateSubmitLessonAttemptParams): Promise<ApolloClient.MutateResult<SubmitLessonAttemptMutation>> => {
    const variables: InputVariables<MutateSubmitLessonAttemptRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
