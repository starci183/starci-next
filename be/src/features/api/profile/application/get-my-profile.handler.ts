import { QueryHandler } from "@nestjs/cqrs"
import { ProfileService, type ProfileView } from "@modules/domain/profile"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMyProfileQuery } from "./get-my-profile.query"

@QueryHandler(GetMyProfileQuery)
/** Reads the profile of the learner who asks. */
export class GetMyProfileHandler extends ICQRSHandler<GetMyProfileQuery, ProfileView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly profiles: ProfileService,
    ) {
        super(logger)
    }

    protected override process(query: GetMyProfileQuery): Promise<ProfileView> {
        return this.profiles.read(query.params.principal.id, query.params.request.locale)
    }
}
