import { Command } from "@nestjs/cqrs"
import type { ExperienceItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AssignExperienceRequest } from "./assign-experience.contracts"

/** Reassigns a pending item. */
export class AssignExperienceCommand extends Command<ExperienceItemView> {
    constructor(readonly params: ExecuteParams<AssignExperienceRequest>) {
        super()
    }
}
