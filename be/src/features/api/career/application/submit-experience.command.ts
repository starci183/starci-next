import { Command } from "@nestjs/cqrs"
import type { ExperienceItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitExperienceRequest } from "./submit-experience.contracts"

/** Sends an item of the signed-in learner to pending review. */
export class SubmitExperienceCommand extends Command<ExperienceItemView> {
    constructor(readonly params: ExecuteParams<SubmitExperienceRequest>) {
        super()
    }
}
