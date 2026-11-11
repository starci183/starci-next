import { CommandHandler } from "@nestjs/cqrs"
import { AttemptSimulationService, type SimulationProgressView } from "@modules/domain/attempt"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SaveLessonSimulationCommand } from "./save-lesson-simulation.command"

@CommandHandler(SaveLessonSimulationCommand)
/** Hands the position of the learner in a simulation to the attempt capability, which replays and keeps it. */
export class SaveLessonSimulationHandler extends ICQRSHandler<SaveLessonSimulationCommand, SimulationProgressView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly simulations: AttemptSimulationService,
    ) {
        super(logger)
    }

    protected override process(command: SaveLessonSimulationCommand): Promise<SimulationProgressView> {
        return this.simulations.save({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
