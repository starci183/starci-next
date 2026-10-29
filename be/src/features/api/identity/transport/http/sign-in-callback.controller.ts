import { Controller, Get, Req, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Request, Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { SignInCallbackCommand } from "../../application/sign-in-callback.command"
import { sendIdentityRedirect, toCallbackRequest } from "./session.mapper"

@Controller("api/identity/session")
/** Consumes provider response values only at the registered callback and never forwards them. */
export class SignInCallbackController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Answers only a fixed safe application outcome once the platform guards admit the callback. */
    @Get("callback")
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    async signInCallback(@Req() request: Request, @Res() response: Response): Promise<void> {
        return sendIdentityRedirect(
            response,
            await this.commandBus.execute(new SignInCallbackCommand({ request: toCallbackRequest(request) })),
        )
    }
}
