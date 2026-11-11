import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LessonInput, LessonQuery, LessonQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonQuery, LessonQueryVariables> = gql`
    query Lesson($input: LessonInput!) {
        lesson(input: $input) {
            id
            title
            description
            version
            category
            group
            topic {
                id
                title
            }
            difficulty
            minutes
            implementation
            overview
            isPremium
            learningOutcomes {
                id
                text
            }
            prerequisites {
                id
                text
            }
            references {
                id
                label
                url
                citation
            }
            sections {
                id
                sortIndex
                phase
                title
                locked
                body
                activities {
                    id
                    kind
                    prompt
                    isDiagnostic
                    criteria {
                        id
                        criterion
                        maxScore
                    }
                    options {
                        id
                        label
                    }
                    simulation {
                        initialStateId
                        debriefQuestion
                        states {
                            id
                            label
                            observation
                            isSuccess
                            facts {
                                label
                                value
                            }
                        }
                        actions {
                            id
                            label
                            isBranch
                        }
                        transitions {
                            id
                            fromStateId
                            actionId
                            toStateId
                        }
                    }
                    exercise {
                        submissionInstructions
                        files {
                            relativePath
                            syntaxLanguage
                            content
                        }
                    }
                }
            }
            workspace {
                runtime
                files {
                    path
                    role
                    content
                }
            }
            workspaces {
                language
                runtime
                files {
                    path
                    role
                    content
                }
            }
        }
    }
`

/** The request of the lesson query: the lesson and the locale of its text. */
type QueryLessonRequest = LessonInput

/** Reads one lesson's public projection (the back end `lesson` query). A missing lesson rejects with LESSON_NOT_FOUND. */
export const queryLesson = async ({
    request,
    signal,
}: QueryParams<QueryLessonRequest>): Promise<ApolloClient.QueryResult<LessonQuery>> => {
    const variables: InputVariables<QueryLessonRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
