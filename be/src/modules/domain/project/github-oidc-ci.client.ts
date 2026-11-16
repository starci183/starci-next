import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProjectLogEvent } from "./project.log-events"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import type { CiAttestationVerifier } from "./project-ci-attestation.port"
import type { CiAttestation, CiAttestationRequest } from "./project-params.contracts"
import { GITHUB_OIDC_JWKS_URL, attestationOf, claimsOf, jwksOf, keyIdOf, type GithubJwk } from "./github-oidc.policy"
import { DEFAULT_CI_OIDC_AUDIENCE } from "./project-repository.service"

/** How long the GitHub key set is kept before it is read again, in milliseconds. */
const KEYS_TTL_MS = 3_600_000

/** The longest GitHub may take to answer the key set request, in milliseconds. */
const FETCH_TIMEOUT_MS = 5000

@Injectable()
/**
 * The GitHub OIDC verifier of the CI attestation port: a run is attested when its Actions token is signed by a GitHub published
 * key, issued for the audience of this app, and names the bound repository, the commit and the run of the signed document. The key
 * set is cached for an hour and read again once when a token names a key it does not hold. An unreachable GitHub or an untrusted
 * token leaves the run signed-only (practice), never a thrown error.
 */
export class GithubOidcCiClient implements CiAttestationVerifier {
    private keys: ReadonlyArray<GithubJwk> = []
    private fetchedAt = 0
    private readonly audience: string

    constructor(
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectProjectOptions() options: ProjectOptions,
    ) {
        this.audience = options.ciOidcAudience ?? DEFAULT_CI_OIDC_AUDIENCE
    }

    /** Attests the run against the GitHub keys; any failure is a signed-only answer with its reason. */
    async attest(request: CiAttestationRequest): Promise<CiAttestation> {
        const kid = keyIdOf(request.token)
        if (kid === null) return { kind: "signed-only", reason: "token" }
        if (!(await this.keysHold(kid)))
            return { kind: "signed-only", reason: this.keys.length === 0 ? "unavailable" : "token" }
        const verified = claimsOf(request.token, this.keys, this.clock.now(), this.audience)
        if ("refusal" in verified) return { kind: "signed-only", reason: verified.refusal }
        return attestationOf(verified.claims, request)
    }

    /** Whether the cached key set holds the key; reads the GitHub set when it is stale or lacks the key (once per call). */
    private async keysHold(kid: string): Promise<boolean> {
        const now = this.clock.now().getTime()
        const fresh = this.keys.length > 0 && now - this.fetchedAt < KEYS_TTL_MS
        if (fresh && this.keys.some((key) => key.kid === kid)) return true
        await this.refresh(now)
        return this.keys.some((key) => key.kid === kid)
    }

    private async refresh(now: number): Promise<void> {
        try {
            const response = await fetch(GITHUB_OIDC_JWKS_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
            if (!response.ok) throw new Error(String(response.status))
            const keys = jwksOf(await response.json())
            if (keys.length > 0) {
                this.keys = keys
                this.fetchedAt = now
            }
        } catch (cause) {
            this.logger.warn(ProjectLogEvent.CiUnattested, { reason: "jwks-unavailable", cause: String(cause) })
        }
    }
}
