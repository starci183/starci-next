import { CommandHandler } from "@nestjs/cqrs"
import { PracticeSolutionService, type PracticeSolutionView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RevealPracticeSolutionCommand } from "./reveal-practice-solution.command"

@CommandHandler(RevealPracticeSolutionCommand)
/** Hands the reveal of a reference solution to the practice capability. */
export class RevealPracticeSolutionHandler extends ICQRSHandler<RevealPracticeSolutionCommand, PracticeSolutionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly solutions: PracticeSolutionService,
    ) {
        super(logger)
    }

    protected override process(message: RevealPracticeSolutionCommand): Promise<PracticeSolutionView> {
        return this.solutions.reveal({
            learnerId: message.params.principal.id,
            slug: message.params.request.slug,
            locale: message.params.request.locale,
        })
    }
}
