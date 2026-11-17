import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SaveLessonSimulationInput,
    SaveLessonSimulationMutation,
    SaveLessonSimulationMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SaveLessonSimulationMutation, SaveLessonSimulationMutationVariables> = gql`
    mutation SaveLessonSimulation($input: SaveLessonSimulationInput!) {
        saveLessonSimulation(input: $input) {
            activityId
            currentStateId
            actionIds
            triedTransitionIds
            updatedAt
        }
    }
`

/** The input of the mutation: the lesson version, the activity, the state the learner stands in and the path of actions that led there. */
type MutateSaveLessonSimulationRequest = SaveLessonSimulationInput

/** Params of {@link mutateSaveLessonSimulation}. */
interface MutateSaveLessonSimulationParams {
    readonly request: MutateSaveLessonSimulationRequest
    readonly signal?: AbortSignal | undefined
}

/** Saves where the learner stands in a simulation (the back end `saveLessonSimulation` mutation), so the walk survives a reload. */
export const mutateSaveLessonSimulation = async ({
    request,
    signal,
}: MutateSaveLessonSimulationParams): Promise<ApolloClient.MutateResult<SaveLessonSimulationMutation>> => {
    const variables: InputVariables<MutateSaveLessonSimulationRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
