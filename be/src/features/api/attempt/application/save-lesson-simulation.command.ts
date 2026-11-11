import { Command } from "@nestjs/cqrs"
import type { SimulationProgressView } from "@modules/domain/attempt"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SaveLessonSimulationRequest } from "./save-lesson-simulation.contracts"

/** Keeps where the signed-in learner stands in a simulation. */
export class SaveLessonSimulationCommand extends Command<SimulationProgressView> {
    constructor(readonly params: ExecuteParams<SaveLessonSimulationRequest>) {
        super()
    }
}
