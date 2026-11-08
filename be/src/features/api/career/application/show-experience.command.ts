import { Command } from "@nestjs/cqrs"
import type { ExperienceItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ShowExperienceRequest } from "./show-experience.contracts"

/** Shows or hides a verified item of the signed-in learner on the public profile. */
export class ShowExperienceCommand extends Command<ExperienceItemView> {
    constructor(readonly params: ExecuteParams<ShowExperienceRequest>) {
        super()
    }
}
