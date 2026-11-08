import { Body, Controller, HttpCode, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { StartSocialCommand } from "../../application/start-social.command"
import { SocialStartRequest } from "./dto/social-start.request"
import type { SocialStartResponse } from "./dto/social-start.response"
import { toStartSocialRequest } from "./credential.mapper"
import { sendSocialStarted } from "./session.mapper"

@Controller("api/identity")
/** The social-start door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SocialStartController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Answers the provider URL and binds the sign-in to this browser; the return path stays server-side. */
    @Post("social/start")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async socialStart(
        @Body() body: SocialStartRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<SocialStartResponse> {
        return sendSocialStarted(
            response,
            await this.commandBus.execute(new StartSocialCommand({ request: toStartSocialRequest(body) })),
        )
    }
}
