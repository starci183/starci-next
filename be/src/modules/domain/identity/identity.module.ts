import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { AuthGuard } from "./auth.guard"
import { CredentialGuard } from "./credential.guard"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { CREDENTIAL_AUTHENTICATOR } from "./identity.decorators"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./identity.module-definition"
import { ChallengeService } from "./challenge.service"
import { CodeMailService } from "./code-mail.service"
import { IdentityAccessService } from "./identity-access.service"
import { SessionService } from "./session.service"
import { SessionHttpService } from "./session-http.service"
import { SocialAccountService } from "./social-account.service"
import { SocialService } from "./social.service"

const refusingAuthenticator: Provider = {
    provide: CREDENTIAL_AUTHENTICATOR,
    useValue: {
        authenticate: () => Promise.reject(new IdentityError({ code: IdentityErrorCode.Unauthenticated })),
    },
}

@Module({})
/** The identity capability: the sign-in flows, the session store, the credential guard and the guard that closes every door by default. The app registers them as APP_GUARDs after the throttler and the origin guard. */
export class IdentityModule extends ConfigurableModuleClass {
    /** Registers the capability once per app; the credential authenticator is the port the app binds. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const authenticator: Provider =
            options.credentialAuthenticator === undefined
                ? refusingAuthenticator
                : { provide: CREDENTIAL_AUTHENTICATOR, useClass: options.credentialAuthenticator }
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                authenticator,
                CredentialGuard,
                AuthGuard,
                SessionService,
                SessionHttpService,
                ChallengeService,
                SocialService,
                SocialAccountService,
                CodeMailService,
                IdentityAccessService,
            ],
            exports: [
                CredentialGuard,
                CREDENTIAL_AUTHENTICATOR,
                AuthGuard,
                SessionService,
                SessionHttpService,
                IdentityAccessService,
            ],
        }
    }
}
