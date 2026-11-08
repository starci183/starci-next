import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AcceptedLocale, type Locale } from "@modules/platform/i18n"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { RequestPasswordResetCommand } from "../../application/request-password-reset.command"
import { PasswordResetRequest } from "./dto/password-reset.request"
import type { PasswordResetResponse } from "./dto/password-reset.response"
import { toRequestPasswordResetRequest, toResetResponse } from "./credential.mapper"

@Controller("api/identity")
/** The password-reset door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class PasswordResetController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Answers the same for registered and unknown emails. */
    @Post("password-reset")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async passwordReset(
        @Body() body: PasswordResetRequest,
        @AcceptedLocale() locale: Locale,
    ): Promise<PasswordResetResponse> {
        return toResetResponse(
            await this.commandBus.execute(
                new RequestPasswordResetCommand({
                    request: toRequestPasswordResetRequest(body, locale),
                }),
            ),
        )
    }
}
