import { Body, Controller, HttpCode, Post } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AcceptedLocale, type Locale } from "@modules/platform/i18n"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { SignInCommand } from "../../application/sign-in.command"
import { SignInRequest } from "./dto/sign-in.request"
import type { SignInResponse } from "./dto/sign-in.response"
import { toSignInRequest, toChallengeResponse } from "./credential.mapper"

@Controller("api/identity")
/** The sign-in door of the app-owned sign-in; it maps the body, dispatches one command and maps back. */
export class SignInController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Checks the credentials and answers the emailed-code challenge; nothing secret returns. */
    @Post("sign-in")
    @HttpCode(200)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async signIn(@Body() body: SignInRequest, @AcceptedLocale() locale: Locale): Promise<SignInResponse> {
        return toChallengeResponse(
            await this.commandBus.execute(new SignInCommand({ request: toSignInRequest(body, locale) })),
        )
    }
}
