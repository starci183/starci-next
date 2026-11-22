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
            essential {
                isLocked
                lockedParts
                story {
                    title
                    body
                    company
                    facts
                }
                opener {
                    id
                    activityId
                    prompt
                    choices {
                        id
                        label
                    }
                    sectionId
                    sectionRef
                    scenarioId
                    event {
                        at
                        text
                    }
                    title
                    symptom
                    probe
                    contextDiagram
                    writtenActivityId
                }
                source {
                    langs
                    ref
                }
                invariants {
                    id
                    text
                }
                architecture {
                    diagram
                    components {
                        name
                        port
                        role
                        invariants
                    }
                }
                codeWalk {
                    id
                    title
                    invariant
                    file
                    line
                    snippet
                    why
                }
                scenarios {
                    id
                    title
                    fault
                    command
                    expected
                    invariant
                    guards
                    hint
                    isHintLocked
                }
                challenges {
                    id
                    level
                    title
                    brief
                    rubric {
                        id
                        criterion
                        points
                        isCritical
                    }
                    hiddenScenarios
                    questions {
                        id
                        activityId
                        prompt
                        choices {
                            id
                            label
                        }
                        sectionId
                        sectionRef
                        sectionRef
                        scenarioId
                        writtenActivityId
                    }
                    writtenRequired
                }
                bugs {
                    tests {
                        id
                        title
                        essence
                        command
                        expected
                        received
                        hintCount
                        isFinal
                    }
                }
                patterns {
                    stack
                    status
                    repo
                    path
                    url
                    where
                    howFar
                    whenDown
                    files {
                        path
                        note
                    }
                    snippet {
                        lang
                        file
                        code
                    }
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
