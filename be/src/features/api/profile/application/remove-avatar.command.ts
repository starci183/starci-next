import { Command } from "@nestjs/cqrs"
import type { ProfileView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyProfileRequest } from "./get-my-profile.contracts"

/** Removes the avatar of the signed-in learner. */
export class RemoveAvatarCommand extends Command<ProfileView> {
    constructor(readonly params: ExecuteParams<GetMyProfileRequest>) {
        super()
    }
}
