import { createPublicKey, verify, type JsonWebKey } from "node:crypto"
import { isRecord } from "@modules/platform/primitives"
import type { CiAttestation, CiAttestationRefusal, CiAttestationRequest } from "./project-params.contracts"

/** The issuer of GitHub Actions OIDC tokens. */
export const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com"

/** Where GitHub publishes the keys that sign them. */
export const GITHUB_OIDC_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`

/** The seconds of clock skew a token's times may have. */
const SKEW_S = 60

const base64urlJson = (part: string | undefined): unknown => {
    try {
        return JSON.parse(Buffer.from(part ?? "", "base64url").toString("utf8")) as unknown
    } catch {
        return undefined
    }
}

const signed = (reason: CiAttestationRefusal): CiAttestation => ({
    kind: "signed-only",
    reason,
})

/** The parts of a token: header, claims and whether its RS256 signature verifies against one of the keys. */
const verifiedClaimsOf = (token: string, keys: ReadonlyArray<JsonWebKey>): Record<string, unknown> | null => {
    const [head, body, signature, extra] = token.split(".")
    if (extra !== undefined || head === undefined || body === undefined || signature === undefined) return null
    const header = base64urlJson(head)
    const claims = base64urlJson(body)
    if (!isRecord(header) || !isRecord(claims) || header["alg"] !== "RS256") return null
    const key = keys.find((candidate) => candidate.kid === header["kid"] && candidate.kty === "RSA")
    if (key === undefined) return null
    try {
        const ok = verify(
            "RSA-SHA256",
            Buffer.from(`${head}.${body}`),
            createPublicKey({ key, format: "jwk" }),
            Buffer.from(signature, "base64url"),
        )
        return ok ? claims : null
    } catch {
        return null
    }
}

const audienceHolds = (aud: unknown, audience: string): boolean =>
    aud === audience || (Array.isArray(aud) && aud.includes(audience))

/**
 * Whether GitHub vouches for a CI run: the OIDC token's RS256 signature verifies against GitHub's published keys, it was issued by
 * GitHub Actions for the app's audience and is within its lifetime, and it names the project's bound repository (and its id, once
 * known), the commit and the run (`<run_id>-<run_attempt>`) of the signed document. Anything else leaves the run signed-only.
 */
export const attestationOf = (
    request: CiAttestationRequest,
    keys: ReadonlyArray<JsonWebKey>,
    audience: string,
    nowS: number,
): CiAttestation => {
    const claims = verifiedClaimsOf(request.token, keys)
    if (claims === null) return signed("token")
    const exp = Number(claims["exp"])
    const nbf = Number(claims["nbf"] ?? claims["iat"] ?? 0)
    if (
        claims["iss"] !== GITHUB_OIDC_ISSUER ||
        !audienceHolds(claims["aud"], audience) ||
        !(exp + SKEW_S > nowS) ||
        nbf - SKEW_S > nowS
    ) {
        return signed("token")
    }
    const repository = String(claims["repository"] ?? "")
    const repositoryId = String(claims["repository_id"] ?? "")
    if (repository.toLowerCase() !== request.repository.toLowerCase() || repositoryId === "")
        return signed("repository")
    if (request.repositoryId !== null && repositoryId !== request.repositoryId) return signed("repository")
    if (String(claims["sha"] ?? "").toLowerCase() !== request.commit.toLowerCase()) return signed("commit")
    if (`${String(claims["run_id"] ?? "")}-${String(claims["run_attempt"] ?? "")}` !== request.runId)
        return signed("run")
    return { kind: "attested", repositoryId }
}
