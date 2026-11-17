import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { BindHarnessBuildMutation, BindHarnessBuildMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<BindHarnessBuildMutation, BindHarnessBuildMutationVariables>

const mutation1: Document = gql`
    mutation BindHarnessBuild($input: BindHarnessBuildInput!) {
        bindHarnessBuild(input: $input) {
            buildId
            repository
            bindingId
            audience
        }
    }
`

/** What the bind takes: the build, the GitHub repository (`owner/name`) and the abort signal. */
interface MutateBindHarnessBuildParams {
    readonly buildId: string
    readonly repository: string
    readonly signal?: AbortSignal | undefined
}

/** Binds a GitHub repository to a build so its CI runs can prove the build; no project is needed. */
export const mutateBindHarnessBuild = async ({
    buildId,
    repository,
    signal,
}: MutateBindHarnessBuildParams): Promise<ApolloClient.MutateResult<BindHarnessBuildMutation>> =>
    createApolloClient({ signal }).mutate({ mutation: mutation1, variables: { input: { buildId, repository } } })
