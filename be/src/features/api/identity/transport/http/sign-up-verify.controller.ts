import { Body, Controller, HttpCode, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { VerifySignUpCommand } from "../../application/verify-sign-up.command"
import { SignUpVerifyRequest } from "./dto/sign-up-verify.request"
import { toVerifySignUpRequest } from "./credential.mapper"
import { sendSessionIssued } from "./session.mapper"

@Controller("api/identity")
/** The sign-up-verify door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SignUpVerifyController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Confirms the registration and sets the host-only session cookie. */
    @Post("sign-up/verify")
    @HttpCode(204)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async signUpVerify(
        @Body() body: SignUpVerifyRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        return sendSessionIssued(
            response,
            await this.commandBus.execute(new VerifySignUpCommand({ request: toVerifySignUpRequest(body) })),
        )
    }
}
