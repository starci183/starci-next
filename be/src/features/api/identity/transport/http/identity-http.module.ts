import { Module } from "@nestjs/common"
import { IdentityApiModule } from "../../identity.module"
import { ChallengeResendController } from "./challenge-resend.controller"
import { CurrentSessionController } from "./current-session.controller"
import { PasswordResetController } from "./password-reset.controller"
import { PasswordResetVerifyController } from "./password-reset-verify.controller"
import { SignInController } from "./sign-in.controller"
import { SignInVerifyController } from "./sign-in-verify.controller"
import { SignOutController } from "./sign-out.controller"
import { SignUpController } from "./sign-up.controller"
import { SignUpVerifyController } from "./sign-up-verify.controller"
import { SocialExchangeController } from "./social-exchange.controller"
import { SocialStartController } from "./social-start.controller"
import { ConfigurableModuleClass } from "./identity-http.module-definition"

@Module({
    imports: [IdentityApiModule.register({})],
    controllers: [
        SignInController,
        SignInVerifyController,
        ChallengeResendController,
        SignUpController,
        SignUpVerifyController,
        PasswordResetController,
        PasswordResetVerifyController,
        SocialStartController,
        SocialExchangeController,
        CurrentSessionController,
        SignOutController,
    ],
})
/** Serves the app-owned sign-in doors, the session read and sign-out; the learner never meets a provider page. */
export class IdentityHttpModule extends ConfigurableModuleClass {}
