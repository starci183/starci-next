import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessGuideInput, HarnessGuideQuery, HarnessGuideQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessGuideQuery, HarnessGuideQueryVariables> = gql`
    query HarnessGuide($input: HarnessGuideInput!) {
        harnessGuide(input: $input) {
            tool
            slug
            order
            title
            summary
            sections {
                id
                order
                title
                body
                run
            }
            probes {
                id
                order
                title
                guide
                fix
                status
                reason
                at
            }
        }
    }
`

/** Reads one guide with its sections and the probes that check it (the back end `harnessGuide` query). */
export const queryHarnessGuide = async ({
    request,
    signal,
}: QueryParams<HarnessGuideInput>): Promise<ApolloClient.QueryResult<HarnessGuideQuery>> => {
    const variables: InputVariables<HarnessGuideInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
