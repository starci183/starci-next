import { Controller, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { StartSignInCommand } from "../../application/start-sign-in.command"
import { sendIdentityRedirect } from "./session.mapper"

@Controller("api/identity/session")
/** Starts the anonymous OIDC browser handshake using the platform's strict Origin admission. */
export class StartSignInController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Redirects to the configured provider after durable transaction issuance. */
    @Post("start")
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async startSignIn(@Res() response: Response): Promise<void> {
        return sendIdentityRedirect(response, await this.commandBus.execute(new StartSignInCommand({ request: {} })))
    }
}
