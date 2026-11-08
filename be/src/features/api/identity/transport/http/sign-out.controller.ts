import { Controller, Headers, HttpCode, Post, Res } from "@nestjs/common"
import type { CommandBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier, RequireOrigin } from "@modules/platform/http-security"
import { SignOutCommand } from "../../application/sign-out.command"
import { sendSignedOut, toSessionRequest } from "./session.mapper"

@Controller("api/identity/session")
/** Revokes locally; a missing cookie is an idempotent cleanup. */
export class SignOutController {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Clears the exact host-only cookie, answering no content, or an explicit persistence refusal. */
    @Post("sign-out")
    @HttpCode(204)
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    @RequireOrigin()
    async signOut(
        @Headers("cookie") cookie: string | undefined,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        return sendSignedOut(
            response,
            await this.commandBus.execute(new SignOutCommand({ request: toSessionRequest(cookie) })),
        )
    }
}
