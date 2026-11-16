import type { JsonWebKey } from "node:crypto"
import { Inject, Injectable } from "@nestjs/common"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { isRecord } from "@modules/platform/primitives"
import { attestationOf, GITHUB_OIDC_JWKS_URL } from "./github-oidc.policy"
import type { CiAttestationVerifier } from "./project-ci-attestation.port"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import type { CiAttestation, CiAttestationRequest } from "./project-params.contracts"
import { DEFAULT_CI_OIDC_AUDIENCE } from "./project-repository.service"

/** How long GitHub's keys are kept before they are fetched again. */
const KEYS_TTL_MS = 3_600_000
const KEYS_TIMEOUT_MS = 5_000

@Injectable()
/**
 * The GitHub Actions OIDC verifier of CI runs (decision Q-PJ-1): it fetches GitHub's signing keys (kept an hour, fetched again for an
 * unknown key id) and checks the run's token against the bound repository, the commit and the run id. GitHub unreachable leaves the
 * run signed-only (`unavailable`), never a throw.
 */
export class GithubOidcClient implements CiAttestationVerifier {
    private keys: ReadonlyArray<JsonWebKey> = []
    private fetchedAt = Number.NEGATIVE_INFINITY

    constructor(
        @Inject(HTTP_CLIENT) private readonly http: HttpClient,
        @InjectClock() private readonly clock: Clock,
        @InjectProjectOptions() private readonly options: ProjectOptions,
    ) {}

    /** Attests the run, or answers why it stays signed-only. */
    async attest(request: CiAttestationRequest): Promise<CiAttestation> {
        const now = this.clock.now().getTime()
        const audience = this.options.ciOidcAudience ?? DEFAULT_CI_OIDC_AUDIENCE
        const first = await this.keysAt(now, false)
        if (first === null) return { kind: "signed-only", reason: "unavailable" }
        const verdict = attestationOf(request, first, audience, Math.floor(now / 1000))
        if (verdict.kind === "attested" || verdict.reason !== "token") return verdict
        const refreshed = await this.keysAt(now, true)
        return refreshed === null || refreshed === first
            ? verdict
            : attestationOf(request, refreshed, audience, Math.floor(now / 1000))
    }

    private async keysAt(now: number, force: boolean): Promise<ReadonlyArray<JsonWebKey> | null> {
        if (!force && this.keys.length > 0 && now - this.fetchedAt < KEYS_TTL_MS) return this.keys
        try {
            const answer = await this.http.request({
                correlationId: `oidc-${now}`,
                method: "GET",
                url: GITHUB_OIDC_JWKS_URL,
                timeoutMs: KEYS_TIMEOUT_MS,
            })
            const keys = isRecord(answer.body) && Array.isArray(answer.body["keys"]) ? answer.body["keys"] : null
            if (answer.status !== 200 || keys === null) return this.keys.length > 0 ? this.keys : null
            this.keys = keys.filter((key): key is JsonWebKey => isRecord(key))
            this.fetchedAt = now
            return this.keys
        } catch {
            return this.keys.length > 0 ? this.keys : null
        }
    }
}
