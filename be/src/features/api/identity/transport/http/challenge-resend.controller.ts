import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { ResendCodeCommand } from "../../application/resend-code.command"
import { ChallengeResendRequest } from "./dto/challenge-resend.request"
import { toResendCodeRequest } from "./credential.mapper"

@Controller("api/identity")
/** The challenge-resend door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class ChallengeResendController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Sends a new code for an open challenge. */
    @Post("challenge/resend")
    @HttpCode(204)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async challengeResend(@Body() body: ChallengeResendRequest): Promise<void> {
        return this.commandBus.execute(new ResendCodeCommand({ request: toResendCodeRequest(body) }))
    }
}
