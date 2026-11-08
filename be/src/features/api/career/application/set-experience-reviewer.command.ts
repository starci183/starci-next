import { Command } from "@nestjs/cqrs"
import type { ReviewerView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetExperienceReviewerRequest } from "./set-experience-reviewer.contracts"

/** Appoints, rescopes or ends a reviewer. */
export class SetExperienceReviewerCommand extends Command<ReviewerView> {
    constructor(readonly params: ExecuteParams<SetExperienceReviewerRequest>) {
        super()
    }
}
