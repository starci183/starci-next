import { Body, Controller, HttpCode, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { VerifySignInCommand } from "../../application/verify-sign-in.command"
import { SignInVerifyRequest } from "./dto/sign-in-verify.request"
import { toVerifySignInRequest } from "./credential.mapper"
import { sendSessionIssued } from "./session.mapper"

@Controller("api/identity")
/** The sign-in-verify door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SignInVerifyController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Completes the sign-in and sets the host-only session cookie. */
    @Post("sign-in/verify")
    @HttpCode(204)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async signInVerify(
        @Body() body: SignInVerifyRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        return sendSessionIssued(
            response,
            await this.commandBus.execute(new VerifySignInCommand({ request: toVerifySignInRequest(body) })),
        )
    }
}
