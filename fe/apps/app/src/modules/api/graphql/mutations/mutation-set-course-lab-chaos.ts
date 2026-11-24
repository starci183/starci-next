import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetCourseLabChaosInput,
    SetCourseLabChaosMutation,
    SetCourseLabChaosMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SetCourseLabChaosMutation, SetCourseLabChaosMutationVariables> = gql`
    mutation SetCourseLabChaos($input: SetCourseLabChaosInput!) {
        setCourseLabChaos(input: $input) {
            action
            device
            manifestId
        }
    }
`

/** Params of {@link mutateSetCourseLabChaos}. */
interface MutateSetCourseLabChaosParams {
    readonly request: SetCourseLabChaosInput
    readonly signal?: AbortSignal | undefined
}

/** Sets the chaos switches that are on in the lab on the learner's machine (the back end `setCourseLabChaos` mutation). */
export const mutateSetCourseLabChaos = async ({
    request,
    signal,
}: MutateSetCourseLabChaosParams): Promise<ApolloClient.MutateResult<SetCourseLabChaosMutation>> => {
    const variables: InputVariables<SetCourseLabChaosInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
