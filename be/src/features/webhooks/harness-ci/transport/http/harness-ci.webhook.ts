import { Controller, Headers, HttpCode, HttpStatus, Post, Req, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { HarnessCiService } from "@modules/domain/harness"
import { Public, PublicReason } from "@modules/domain/identity"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"

/** The acknowledgement the StarCi CLI reads with the 200 status. */
export const PROVIDER_ACK = { received: true } as const

@Controller("webhooks/harness-ci")
/**
 * POST /webhooks/harness-ci, the intake door of the CI runs of /harness builds (free for everyone, no Project, no signing secret).
 * The learner workflow names its binding in `x-starci-binding` and carries the run GitHub Actions OIDC token in `x-starci-oidc`;
 * the domain intake reads the document, claims its run id, and records it only when GitHub vouches for the bound repository, the
 * commit and the run. An unattested or unknown delivery is its thrown error (401, 400, 403); a recorded one, new or repeated, is
 * answered 200 so the Action never retries a run StarCi has already seen.
 */
export class HarnessCiWebhook {
    constructor(private readonly runs: HarnessCiService) {}

    /** Acknowledges with 200 and `{"received": true}`; a repeated run id is answered without recording it again. */
    @Post()
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict, RateBucket.Webhook)
    async receive(
        @Req() request: RawBodyRequest<Request>,
        @Headers("x-starci-binding") bindingId: string | undefined,
        @Headers("x-starci-oidc") oidcToken: string | undefined,
    ): Promise<typeof PROVIDER_ACK> {
        await this.runs.recordRun({ bindingId, rawBody: request.rawBody, oidcToken })
        return PROVIDER_ACK
    }
}
