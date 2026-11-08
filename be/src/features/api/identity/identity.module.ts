import { Module } from "@nestjs/common"
import { SignInHandler } from "./application/sign-in.handler"
import { VerifySignInHandler } from "./application/verify-sign-in.handler"
import { ResendCodeHandler } from "./application/resend-code.handler"
import { SignUpHandler } from "./application/sign-up.handler"
import { VerifySignUpHandler } from "./application/verify-sign-up.handler"
import { RequestPasswordResetHandler } from "./application/request-password-reset.handler"
import { VerifyPasswordResetHandler } from "./application/verify-password-reset.handler"
import { StartSocialHandler } from "./application/start-social.handler"
import { ExchangeSocialHandler } from "./application/exchange-social.handler"
import { CurrentSessionHandler } from "./application/current-session.handler"
import { SignOutHandler } from "./application/sign-out.handler"
import { ConfigurableModuleClass } from "./identity.module-definition"

@Module({
    providers: [
        SignInHandler,
        VerifySignInHandler,
        ResendCodeHandler,
        SignUpHandler,
        VerifySignUpHandler,
        RequestPasswordResetHandler,
        VerifyPasswordResetHandler,
        StartSocialHandler,
        ExchangeSocialHandler,
        CurrentSessionHandler,
        SignOutHandler,
    ],
})
/** Binds the credential, challenge and social operations and the session reads to their domain owners. */
export class IdentityApiModule extends ConfigurableModuleClass {}
