import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetProjectConceptInput,
    SetProjectConceptMutation,
    SetProjectConceptMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<SetProjectConceptMutation, SetProjectConceptMutationVariables> = gql`
    mutation SetProjectConcept($input: SetProjectConceptInput!) {
        setProjectConcept(input: $input) {
            id
            label
            kind
            state
            comingSoon
            lesson {
                id
                topicId
                title
            }
            location
            endpoint
            sampleBody
            slots {
                slot
                required
                state
                proof
                source
                ref
                at
            }
            failing {
                slot
                probeId
                reason
                facts {
                    key
                    value
                }
                question
            }
            aiQuestion
        }
    }
`

/** Points a concept of a project at code and at the endpoint the probes aim at. */
export const mutateSetProjectConcept = async ({
    request,
    signal,
}: QueryParams<SetProjectConceptInput>): Promise<ApolloClient.MutateResult<SetProjectConceptMutation>> => {
    const variables: InputVariables<SetProjectConceptInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
