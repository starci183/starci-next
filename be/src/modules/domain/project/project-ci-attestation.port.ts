import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { CiAttestation, CiAttestationRequest } from "./project-params.contracts"

/**
 * The port through which the Projects shard asks whether GitHub vouches for a CI run (decision Q-PJ-1): the run's GitHub Actions
 * OIDC token, verified against GitHub's keys, must name the project's bound repository, the commit and the run id of the signed
 * document. The HMAC signature stays the transport check; only an attested run is proof, a signed-only run is practice. Until the
 * GitHub OIDC integration is composed, the app binds `UnattestedCiClient`, which attests nothing.
 */
export interface CiAttestationVerifier {
    /** Attests the run, or answers why it stays signed-only; an untrusted token or an unreachable GitHub is signed-only, never a throw. */
    attest(request: CiAttestationRequest): Promise<CiAttestation>
}

/** Token of the CI attestation port. */
export const PROJECT_CI_ATTESTATION: unique symbol = Symbol("domain.project.ci-attestation")

/** Injects the CI attestation port. Parameter type: CiAttestationVerifier. */
export const InjectCiAttestation = (): TypedParameterDecorator<CiAttestationVerifier> =>
    injector<CiAttestationVerifier>(PROJECT_CI_ATTESTATION)
