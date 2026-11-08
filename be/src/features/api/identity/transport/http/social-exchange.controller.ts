import { Body, Controller, Headers, HttpCode, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { ExchangeSocialCommand } from "../../application/exchange-social.command"
import { SocialExchangeRequest } from "./dto/social-exchange.request"
import type { SocialExchangeResponse } from "./dto/social-exchange.response"
import { toExchangeSocialRequest } from "./credential.mapper"
import { sendSocialSession, toSocialBindingOf } from "./session.mapper"

@Controller("api/identity")
/** The social-exchange door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SocialExchangeController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /**
     * Consumes the callback code and state once, only for the browser whose pre-authentication cookie carries that state,
     * and sets the host-only session cookie.
     */
    @Post("social/exchange")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async socialExchange(
        @Body() body: SocialExchangeRequest,
        @Headers("cookie") cookie: string | undefined,
        @Res({ passthrough: true }) response: Response,
    ): Promise<SocialExchangeResponse> {
        const request = toExchangeSocialRequest(body, toSocialBindingOf(cookie))
        return sendSocialSession(response, await this.commandBus.execute(new ExchangeSocialCommand({ request })))
    }
}
