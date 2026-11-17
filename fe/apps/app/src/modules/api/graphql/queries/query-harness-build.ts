import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessBuildInput, HarnessBuildQuery, HarnessBuildQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessBuildQuery, HarnessBuildQueryVariables> = gql`
    query HarnessBuild($input: HarnessBuildInput!) {
        harnessBuild(input: $input) {
            id
            order
            title
            summary
            keys {
                id
                anyOf
                note
            }
            stageCount
            practisingStages
            provedStages
            state
            runtime {
                dir
                install
                e2e
                report
            }
            repository {
                bound
                repository
                bindingId
                audience
            }
            stages {
                id
                order
                title
                summary
                state
                e2e {
                    id
                    state
                    passed
                    commit
                    at
                }
                steps {
                    id
                    order
                    title
                    body
                    run
                }
                lastRunAt
                lastWhy
            }
        }
    }
`

/** Reads one build with its stages, the e2e state of each and the step guide (the back end `harnessBuild` query). */
export const queryHarnessBuild = async ({
    request,
    signal,
}: QueryParams<HarnessBuildInput>): Promise<ApolloClient.QueryResult<HarnessBuildQuery>> => {
    const variables: InputVariables<HarnessBuildInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
