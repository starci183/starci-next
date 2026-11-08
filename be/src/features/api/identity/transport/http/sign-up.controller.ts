import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AcceptedLocale, type Locale } from "@modules/platform/i18n"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { SignUpCommand } from "../../application/sign-up.command"
import { SignUpRequest } from "./dto/sign-up.request"
import type { SignUpResponse } from "./dto/sign-up.response"
import { toSignUpRequest, toChallengeResponse } from "./credential.mapper"

@Controller("api/identity")
/** The sign-up door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SignUpController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Registers the account and answers the emailed-code challenge. */
    @Post("sign-up")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async signUp(@Body() body: SignUpRequest, @AcceptedLocale() locale: Locale): Promise<SignUpResponse> {
        return toChallengeResponse(
            await this.commandBus.execute(new SignUpCommand({ request: toSignUpRequest(body, locale) })),
        )
    }
}
