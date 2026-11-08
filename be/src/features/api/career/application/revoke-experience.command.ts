import { Command } from "@nestjs/cqrs"
import type { ExperienceItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RevokeExperienceRequest } from "./revoke-experience.contracts"

/** Revokes a verified item. */
export class RevokeExperienceCommand extends Command<ExperienceItemView> {
    constructor(readonly params: ExecuteParams<RevokeExperienceRequest>) {
        super()
    }
}
