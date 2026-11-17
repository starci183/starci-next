import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LessonTopicInput, LessonTopicQuery, LessonTopicQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonTopicQuery, LessonTopicQueryVariables> = gql`
    query LessonTopic($input: LessonTopicInput!) {
        lessonTopic(input: $input) {
            id
            title
            group
            from
            description
            prerequisites
            related {
                id
                title
                listed
            }
            path {
                order
                title
                lessonId
            }
        }
    }
`

/** The request of the topic query: the topic and the locale of its text. */
type QueryLessonTopicRequest = LessonTopicInput

/** Reads one topic and its path (the back end `lessonTopic` query). A missing topic rejects with LESSON_TOPIC_NOT_FOUND. */
export const queryLessonTopic = async ({
    request,
    signal,
}: QueryParams<QueryLessonTopicRequest>): Promise<ApolloClient.QueryResult<LessonTopicQuery>> => {
    const variables: InputVariables<QueryLessonTopicRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
