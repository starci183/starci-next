import { Controller, Headers, HttpCode, HttpStatus, Post, Req, type RawBodyRequest } from "@nestjs/common"
import type { Request } from "express"
import { Public, PublicReason } from "@modules/domain/identity"
import { ProjectCiService } from "@modules/domain/project"
import { RateBucket, RateLimit, RateTier } from "@modules/platform/http-security"

/** The acknowledgement the StarCi GitHub Action reads with the 200 status. */
export const PROVIDER_ACK = { received: true } as const

@Controller("webhooks/project-ci")
/**
 * POST /webhooks/project-ci, the signed intake door of the StarCi GitHub Action. `recordRun` is this door's declared domain
 * verifier (project-ci-http.module's `webhookVerifiers`): it finds the project named in `x-starci-project`, proves the
 * `x-starci-signature` (HMAC-SHA256 over `<x-starci-timestamp>.<raw body>` with that project's secret) and the replay window before
 * the document is read, then records the run once per run id. The optional `x-starci-oidc` header carries the run's GitHub Actions
 * OIDC token: when GitHub vouches for the bound repository, the commit and the run id, the run is attested proof, else it is
 * signed-only practice (decision Q-PJ-1). An unproved delivery is its thrown error (401, 400); a proved one,
 * new or repeated, is answered 200 so the Action never retries a run StarCi has already recorded.
 */
export class ProjectCiWebhook {
    constructor(private readonly runs: ProjectCiService) {}

    /** Acknowledges with 200 and `{"received": true}`; a repeated run id is answered without recording it again. */
    @Post()
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.SignedWebhook })
    @RateLimit(RateTier.Strict, RateBucket.Webhook)
    async receive(
        @Req() request: RawBodyRequest<Request>,
        @Headers("x-starci-project") projectId: string | undefined,
        @Headers("x-starci-timestamp") timestamp: string | undefined,
        @Headers("x-starci-signature") signature: string | undefined,
        @Headers("x-starci-oidc") oidcToken: string | undefined,
    ): Promise<typeof PROVIDER_ACK> {
        await this.runs.recordRun({ rawBody: request.rawBody, projectId, timestamp, signature, oidcToken })
        return PROVIDER_ACK
    }
}
