import { CommandHandler } from "@nestjs/cqrs"
import { StreakService, type StreakGoalView } from "@modules/domain/streak"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetStreakGoalCommand } from "./set-streak-goal.command"

@CommandHandler(SetStreakGoalCommand)
/** Hands the goal of the learner to the streak capability, which checks and stores it. */
export class SetStreakGoalHandler extends ICQRSHandler<SetStreakGoalCommand, StreakGoalView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly streaks: StreakService,
    ) {
        super(logger)
    }

    protected override process(command: SetStreakGoalCommand): Promise<StreakGoalView> {
        return this.streaks.setGoal(command.params.principal.id, command.params.request)
    }
}
