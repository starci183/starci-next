import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ExplainProjectConceptInput,
    ExplainProjectConceptMutation,
    ExplainProjectConceptMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<ExplainProjectConceptMutation, ExplainProjectConceptMutationVariables> = gql`
    mutation ExplainProjectConcept($input: ExplainProjectConceptInput!) {
        explainProjectConcept(input: $input) {
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

/** Has the AI teacher read the code a concept points to and the learner's explanation. */
export const mutateExplainProjectConcept = async ({
    request,
    signal,
}: QueryParams<ExplainProjectConceptInput>): Promise<ApolloClient.MutateResult<ExplainProjectConceptMutation>> => {
    const variables: InputVariables<ExplainProjectConceptInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
