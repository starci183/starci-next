import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    CourseLessonAuditQuery,
    CourseLessonAuditQueryVariables,
    CourseLessonBeforeAfterQuery,
    CourseLessonBeforeAfterQueryVariables,
    CourseLessonInput,
    CourseLessonQuery,
    CourseLessonQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<CourseLessonQuery, CourseLessonQueryVariables> = gql`
    query CourseLesson($input: CourseLessonInput!) {
        courseLesson(input: $input) {
            lessonId
            version
            lab
            concept
            requires
            allowedTerms {
                id
                term
            }
            terms {
                term
                note {
                    vi
                    en
                }
            }
            stack {
                language
                runtime
                test
                host
                services {
                    id
                    port
                    db
                    uses
                    role {
                        vi
                        en
                    }
                    icon
                }
                deps {
                    id
                    image
                    role {
                        vi
                        en
                    }
                    icon
                }
            }
            learnerFile
            invariants {
                id
                vi
                en
            }
            happy {
                id
                title {
                    vi
                    en
                }
                chaos {
                    key
                    value
                }
                invariants
                teaches
                hints {
                    level
                    text
                    unlocked
                }
                hasReference
                question {
                    vi
                    en
                }
                recap {
                    did {
                        vi
                        en
                    }
                    gain {
                        vi
                        en
                    }
                    en
                }
                focus {
                    file
                    lines
                }
                situation {
                    vi
                    en
                }
            }
            unhappy {
                id
                title {
                    vi
                    en
                }
                chaos {
                    key
                    value
                }
                invariants
                teaches
                hints {
                    level
                    text
                    unlocked
                }
                hasReference
                question {
                    vi
                    en
                }
                recap {
                    did {
                        vi
                        en
                    }
                    gain {
                        vi
                        en
                    }
                    en
                }
                focus {
                    file
                    lines
                }
                situation {
                    vi
                    en
                }
            }
            architecture {
                flow {
                    text {
                        vi
                        en
                    }
                    icon
                }
                requests {
                    n
                    from
                    to
                    method
                    path
                    does {
                        vi
                        en
                    }
                }
                tables {
                    serviceId
                    tables
                }
                why {
                    vi
                    en
                }
                files {
                    path
                    role {
                        vi
                        en
                    }
                    excerpt {
                        from
                        to
                        code
                    }
                    marks {
                        line
                        request
                    }
                }
            }
            chaos {
                id
                label {
                    vi
                    en
                }
            }
            grader {
                steps
                faults
            }
            nestjs {
                from
                to
            }
            hook {
                title {
                    vi
                    en
                }
                when {
                    vi
                    en
                }
                asker {
                    vi
                    en
                }
                scene {
                    vi
                    en
                }
                question {
                    vi
                    en
                }
                stuck {
                    vi
                    en
                }
                pushback {
                    vi
                    en
                }
                promise {
                    vi
                    en
                }
            }
            outcomes {
                can {
                    vi
                    en
                }
                caseId
            }
            recall {
                title {
                    vi
                    en
                }
                paragraphs {
                    vi
                    en
                }
            }
            closing {
                beyond {
                    vi
                    en
                }
                answer {
                    vi
                    en
                }
            }
            production {
                repo
                lang
                checked
                files {
                    path
                    url
                }
                shows {
                    caseId
                    value
                }
                note {
                    vi
                    en
                }
            }
            reference {
                repo
                commit
                lang
                url
                checked
                command
                shows {
                    caseId
                    value
                }
                note {
                    vi
                    en
                }
                variants {
                    lang
                    label
                    status
                    folder
                }
                stack
                libs
            }
        }
    }
`

/** Reads the record of one course lesson in the learner's language (the back end `courseLesson` query). */
export const queryCourseLesson = async ({
    request,
    signal,
}: QueryParams<CourseLessonInput>): Promise<ApolloClient.QueryResult<CourseLessonQuery>> => {
    const variables: InputVariables<CourseLessonInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}

/**
 * The stored read-through audit of one course lesson, its own query (owner 2026-11-28: the audit made the lesson query pass the API's field
 * cap, GRAPHQL_FIELDS_MAX 300, so every lesson failed): read only on the dev-only Audit tab, so the lesson query stays the size learners need.
 */
const query2: TypedDocumentNode<CourseLessonAuditQuery, CourseLessonAuditQueryVariables> = gql`
    query CourseLessonAudit($input: CourseLessonInput!) {
        courseLesson(input: $input) {
            lessonId
            audit {
                checked
                reader
                prerequisites
                pages {
                    page
                    verdict
                    note
                }
                findings {
                    id
                    page
                    kind
                    quote
                    why
                    fix
                    rank
                    status
                }
                cases {
                    id
                    kind
                    title
                    now {
                        situation
                        question
                        conditions
                        hints
                    }
                    expected {
                        file
                        diff
                        what
                    }
                    thinking {
                        learns
                        shift
                        interview
                        impact
                        mechanical
                        mechanicalWhy
                    }
                    guess
                    verdict
                    note
                }
            }
        }
    }
`

/** Reads the stored audit of one course lesson (the back end `courseLesson` query, its `audit` alone). */
export const queryCourseLessonAudit = async ({
    request,
    signal,
}: QueryParams<CourseLessonInput>): Promise<ApolloClient.QueryResult<CourseLessonAuditQuery>> => {
    const variables: InputVariables<CourseLessonInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query2, variables, fetchPolicy: "no-cache" })
}

/**
 * The before-and-after block of every unhappy case of one lesson, its own query (owner 2026-11-28): the lesson query stands at the API's
 * field cap (GRAPHQL_FIELDS_MAX 300), so the block is read apart, only on the loop pages. The server hands the fix, the "after" side and
 * the idea only once a case is revealed (green once, or every hint opened); happy cases carry no block.
 */
const query3: TypedDocumentNode<CourseLessonBeforeAfterQuery, CourseLessonBeforeAfterQueryVariables> = gql`
    query CourseLessonBeforeAfter($input: CourseLessonInput!) {
        courseLesson(input: $input) {
            lessonId
            unhappy {
                id
                beforeAfter {
                    before {
                        steps
                        result
                        damage
                    }
                    after {
                        steps
                        result
                        gain
                    }
                    fix
                    idea
                }
            }
        }
    }
`

/** Reads the before-and-after block of every unhappy case of one course lesson (the back end `courseLesson` query, that block alone). */
export const queryCourseLessonBeforeAfter = async ({
    request,
    signal,
}: QueryParams<CourseLessonInput>): Promise<ApolloClient.QueryResult<CourseLessonBeforeAfterQuery>> => {
    const variables: InputVariables<CourseLessonInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query3, variables, fetchPolicy: "no-cache" })
}
