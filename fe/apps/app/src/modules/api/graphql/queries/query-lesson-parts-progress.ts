import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LessonPartsProgressInput,
    LessonPartsProgressQuery,
    LessonPartsProgressQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonPartsProgressQuery, LessonPartsProgressQueryVariables> = gql`
    query LessonPartsProgress($input: LessonPartsProgressInput!) {
        lessonPartsProgress(input: $input) {
            lessonId
            inProgressPart
            proved
            usedHint
            opener {
                answered
                firstCorrect
                latestCorrect
            }
            parts {
                part
                state
                done
                total
            }
        }
    }
`

/** Reads the learner's progress in the four parts of many lessons at once (the back end `lessonPartsProgress` query). */
export const queryLessonPartsProgress = async ({
    request,
    signal,
}: QueryParams<LessonPartsProgressInput>): Promise<ApolloClient.QueryResult<LessonPartsProgressQuery>> => {
    const variables: InputVariables<LessonPartsProgressInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
