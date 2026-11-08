import { Injectable } from "@nestjs/common"
import type { CiAttestationVerifier } from "./project-ci-attestation.port"
import type { CiAttestation } from "./project-params.contracts"

@Injectable()
/** The attestation port while no GitHub OIDC verifier is composed: no run is attested, so every CI run stays signed-only practice. */
export class UnattestedCiClient implements CiAttestationVerifier {
    /** Attests nothing. */
    attest(): Promise<CiAttestation> {
        return Promise.resolve({ kind: "signed-only", reason: "unconfigured" })
    }
}
