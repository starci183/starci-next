import { Module } from "@nestjs/common"
import { IdentityApiModule } from "../../identity.module"
import { StartSignInController } from "./start-sign-in.controller"
import { SignInCallbackController } from "./sign-in-callback.controller"
import { CurrentSessionController } from "./current-session.controller"
import { SignOutController } from "./sign-out.controller"
import { ConfigurableModuleClass } from "./identity-http.module-definition"

@Module({
    imports: [IdentityApiModule.register({})],
    controllers: [StartSignInController, SignInCallbackController, CurrentSessionController, SignOutController],
})
/** Serves only the four recorded cookie and redirect session doors. */
export class IdentityHttpModule extends ConfigurableModuleClass {}
