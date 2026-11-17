import { Command } from "@nestjs/cqrs"
import type { ProfileView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ConfirmAvatarUploadRequest } from "./confirm-avatar-upload.contracts"

/** Keeps an uploaded avatar for the signed-in learner. */
export class ConfirmAvatarUploadCommand extends Command<ProfileView> {
    constructor(readonly params: ExecuteParams<ConfirmAvatarUploadRequest>) {
        super()
    }
}
