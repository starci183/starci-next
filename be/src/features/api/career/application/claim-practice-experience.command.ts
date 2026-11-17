import { Command } from "@nestjs/cqrs"
import type { ExperienceItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ClaimPracticeExperienceRequest } from "./claim-practice-experience.contracts"

/** Claims the experience of a practice pattern; refused unless every problem is Accepted and none had its solution revealed first. */
export class ClaimPracticeExperienceCommand extends Command<ExperienceItemView> {
    constructor(readonly params: ExecuteParams<ClaimPracticeExperienceRequest>) {
        super()
    }
}
