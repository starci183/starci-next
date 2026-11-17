import { Command } from "@nestjs/cqrs"
import type { AvatarUploadView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RequestAvatarUploadRequest } from "./request-avatar-upload.contracts"

/** Asks for a signed avatar upload for the signed-in learner. */
export class RequestAvatarUploadCommand extends Command<AvatarUploadView> {
    constructor(readonly params: ExecuteParams<RequestAvatarUploadRequest>) {
        super()
    }
}
