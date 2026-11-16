import { CommandHandler } from "@nestjs/cqrs"
import { ProfileService, type ProfileView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SetProfileNameCommand } from "./set-profile-name.command"

@CommandHandler(SetProfileNameCommand)
/** Hands the display name to the profile capability, which checks and stores it. */
export class SetProfileNameHandler extends ICQRSHandler<SetProfileNameCommand, ProfileView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly profiles: ProfileService,
    ) {
        super(logger)
    }

    protected override process(command: SetProfileNameCommand): Promise<ProfileView> {
        return this.profiles.setDisplayName(
            command.params.principal.id,
            command.params.request.displayName,
            command.params.request.locale,
        )
    }
}
