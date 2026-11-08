import { CommandRunner, SubCommand } from "nest-commander"
import { ExperienceReviewService } from "@modules/domain/career"

@SubCommand({
    name: "escalate",
    description: "Move the review items past their deadline to the teacher's queue (one bounded batch)",
})
/**
 * `cli career escalate`: delegates one batch of the SLA escalation. It is the operator's runner of the sweep until a jobs tick
 * runs it every minute (BE-JOBS-6), which this app cannot compose yet.
 */
export class EscalateExperienceCli extends CommandRunner {
    constructor(private readonly reviews: ExperienceReviewService) {
        super()
    }

    /** Escalates the overdue items. */
    async run(): Promise<void> {
        await this.reviews.escalateOverdue()
    }
}
