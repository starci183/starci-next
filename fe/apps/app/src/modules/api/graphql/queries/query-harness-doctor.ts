import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { HarnessDoctorInput, HarnessDoctorQuery, HarnessDoctorQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<HarnessDoctorQuery, HarnessDoctorQueryVariables> = gql`
    query HarnessDoctor($input: HarnessDoctorInput!) {
        harnessDoctor(input: $input) {
            tool
            passed
            total
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

/** Reads the doctor probes of one tool with the newest result of each (the back end `harnessDoctor` query). */
export const queryHarnessDoctor = async ({
    request,
    signal,
}: QueryParams<HarnessDoctorInput>): Promise<ApolloClient.QueryResult<HarnessDoctorQuery>> => {
    const variables: InputVariables<HarnessDoctorInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
