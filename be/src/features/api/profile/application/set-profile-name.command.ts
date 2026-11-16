import { Command } from "@nestjs/cqrs"
import type { ProfileView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetProfileNameRequest } from "./set-profile-name.contracts"

/** Sets the display name of the signed-in learner. */
export class SetProfileNameCommand extends Command<ProfileView> {
    constructor(readonly params: ExecuteParams<SetProfileNameRequest>) {
        super()
    }
}
