import { Injectable } from "@nestjs/common"
import { InjectKeycloakGateway, type KeycloakGateway } from "@modules/integrations/keycloak"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { IdentityLogEvent } from "./identity.log-events"

@Injectable()
/**
 * Names the learner of a social sign-in. The provider's code exchange verifies the ID token but hands back no name claim, so
 * the account's login name (the realm's `preferred_username`) is looked up by the verified email.
 */
export class SocialAccountService {
    constructor(
        @InjectKeycloakGateway() private readonly gateway: KeycloakGateway,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /** The login name of the account an email belongs to, or null when there is none; a failed lookup is recorded and never fails the sign-in. */
    async usernameOf(email: string | null): Promise<string | null> {
        if (email === null) return null
        const account = await this.gateway.findUserByEmail(email).catch((cause: unknown) => {
            this.logger.error(IdentityLogEvent.AccountLookupFailed, cause)
            return null
        })
        return account?.username ?? null
    }
}
