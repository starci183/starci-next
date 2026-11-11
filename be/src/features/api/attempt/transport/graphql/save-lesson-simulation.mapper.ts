import type { SimulationProgressView } from "@modules/domain/attempt"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SaveLessonSimulationRequest } from "../../application/save-lesson-simulation.contracts"
import type { LessonProgressSimulationType } from "./dto/lesson-progress-simulation.type"
import type { SaveLessonSimulationInput } from "./dto/save-lesson-simulation.input"

/** Maps the save input and the session to the message params. */
export const toSaveLessonSimulationParams = (
    identity: IdentityPrincipal,
    input: SaveLessonSimulationInput,
): ExecuteParams<SaveLessonSimulationRequest> => ({
    request: {
        lessonId: input.lessonId,
        version: input.version,
        activityId: input.activityId,
        locale: input.locale,
        currentStateId: input.currentStateId,
        actionIds: input.actionIds,
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the kept position to its GraphQL type. */
export const toLessonProgressSimulationType = (view: SimulationProgressView): LessonProgressSimulationType => view
