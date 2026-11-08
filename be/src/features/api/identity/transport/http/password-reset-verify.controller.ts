import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { VerifyPasswordResetCommand } from "../../application/verify-password-reset.command"
import { PasswordResetVerifyRequest } from "./dto/password-reset-verify.request"
import { toVerifyPasswordResetRequest } from "./credential.mapper"

@Controller("api/identity")
/** The password-reset-verify door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class PasswordResetVerifyController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Changes the password; every session of that learner is revoked. */
    @Post("password-reset/verify")
    @HttpCode(204)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async passwordResetVerify(@Body() body: PasswordResetVerifyRequest): Promise<void> {
        return this.commandBus.execute(new VerifyPasswordResetCommand({ request: toVerifyPasswordResetRequest(body) }))
    }
}
