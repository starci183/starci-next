import { CommandHandler } from "@nestjs/cqrs"
import { ProfileService, type ProfileView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RemoveAvatarCommand } from "./remove-avatar.command"

@CommandHandler(RemoveAvatarCommand)
/** Removes the avatar of the learner and deletes its object. */
export class RemoveAvatarHandler extends ICQRSHandler<RemoveAvatarCommand, ProfileView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly profiles: ProfileService,
    ) {
        super(logger)
    }

    protected override process(command: RemoveAvatarCommand): Promise<ProfileView> {
        return this.profiles.removeAvatar(command.params.principal.id, command.params.request.locale)
    }
}
