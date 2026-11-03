import { Module } from "@nestjs/common"
import { StartSignInHandler } from "./application/start-sign-in.handler"
import { SignInCallbackHandler } from "./application/sign-in-callback.handler"
import { CurrentSessionHandler } from "./application/current-session.handler"
import { SignOutHandler } from "./application/sign-out.handler"
import { ConfigurableModuleClass } from "./identity.module-definition"

@Module({ providers: [StartSignInHandler, SignInCallbackHandler, CurrentSessionHandler, SignOutHandler] })
/** Binds the four session operations to their single lifecycle owner. */
export class IdentityApiModule extends ConfigurableModuleClass {}
