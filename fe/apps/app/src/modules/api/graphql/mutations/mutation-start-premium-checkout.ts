import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { StartPremiumCheckoutMutation, StartPremiumCheckoutMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<StartPremiumCheckoutMutation, StartPremiumCheckoutMutationVariables>

const mutation1: Document = gql`
    mutation StartPremiumCheckout($input: StartPremiumCheckoutInput!) {
        startPremiumCheckout(input: $input) {
            orderId
            rail
            redirect {
                method
                url
                fields {
                    name
                    value
                }
            }
        }
    }
`

/** What the mutation takes: the plan, the rail (omitted, the server picks the last one used, else SePay) and the signal. */
interface MutateStartPremiumCheckoutParams {
    readonly plan: string
    readonly rail?: string | undefined
    readonly signal?: AbortSignal | undefined
}

/** Starts a Premium checkout; each call creates its own order, so the caller disables its trigger while one is pending. */
export const mutateStartPremiumCheckout = async ({
    plan,
    rail,
    signal,
}: MutateStartPremiumCheckoutParams): Promise<ApolloClient.MutateResult<StartPremiumCheckoutMutation>> =>
    createApolloClient({ signal }).mutate({
        mutation: mutation1,
        variables: { input: { plan, rail: rail ?? null } },
    })
