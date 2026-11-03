import { Controller, Get, Headers, Res } from "@nestjs/common"
import type { QueryBus } from "@nestjs/cqrs"
import type { Response } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import type { IdentitySessionView } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { CurrentSessionQuery } from "../../application/current-session.query"
import { toSessionResponse, toSessionRequest } from "./session.mapper"

@Controller("api/identity/session")
/** Reads authentication state through the same durable authority every protected request uses. */
export class CurrentSessionController {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Returns the verified identity schema or the explicit session refusal. */
    @Get()
    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    async currentSession(
        @Headers("cookie") cookie: string | undefined,
        @Res({ passthrough: true }) response: Response,
    ): Promise<IdentitySessionView> {
        return toSessionResponse(
            response,
            await this.queryBus.execute(
                new CurrentSessionQuery({
                    request: toSessionRequest(cookie),
                }),
            ),
        )
    }
}
