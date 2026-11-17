import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RunProjectProbesInput,
    RunProjectProbesMutation,
    RunProjectProbesMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<RunProjectProbesMutation, RunProjectProbesMutationVariables> = gql`
    mutation RunProjectProbes($input: RunProjectProbesInput!) {
        runProjectProbes(input: $input) {
            runId
            url
            passed
            at
            results {
                probeId
                conceptId
                passed
                reason
                facts {
                    key
                    value
                }
            }
        }
    }
`

/** Probes the deployed address of a project with the generic StarCi probes. */
export const mutateRunProjectProbes = async ({
    request,
    signal,
}: QueryParams<RunProjectProbesInput>): Promise<ApolloClient.MutateResult<RunProjectProbesMutation>> => {
    const variables: InputVariables<RunProjectProbesInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
