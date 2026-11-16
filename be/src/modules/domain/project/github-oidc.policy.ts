import { createPublicKey, verify } from "node:crypto"
import { isRecord } from "@modules/platform/primitives"
import type { CiAttestation, CiAttestationRefusal, CiAttestationRequest } from "./project-params.contracts"

/** The issuer of GitHub Actions OIDC tokens. */
export const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com"

/** Where GitHub publishes the keys its tokens are signed with. */
export const GITHUB_OIDC_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`

/** The clock skew a token's times may have, in milliseconds. */
const SKEW_MS = 60_000

/** One RSA key of the GitHub key set. */
export interface GithubJwk {
    /** The key id the token header names. */
    readonly kid: string
    /** The key type, `RSA`. */
    readonly kty: string
    /** The modulus, base64url. */
    readonly n: string
    /** The exponent, base64url. */
    readonly e: string
}

/** The claims of a GitHub Actions token this app reads. */
export interface GithubClaims {
    /** The repository, `owner/name`. */
    readonly repository: string
    /** GitHub id of the repository. */
    readonly repositoryId: string
    /** The commit the run tested, lowercase. */
    readonly sha: string
    /** The run id. */
    readonly runId: string
}

/** The keys of a parsed key set document; anything else is no keys. */
export const jwksOf = (document: unknown): ReadonlyArray<GithubJwk> => {
    const keys = isRecord(document) ? document["keys"] : undefined
    if (!Array.isArray(keys)) return []
    return keys.flatMap((key: unknown): Array<GithubJwk> => {
        if (!isRecord(key)) return []
        const { kid, kty, n, e } = key
        return typeof kid === "string" && kty === "RSA" && typeof n === "string" && typeof e === "string"
            ? [{ kid, kty, n, e }]
            : []
    })
}

const jsonOf = (part: string): Record<string, unknown> | null => {
    try {
        const value: unknown = JSON.parse(Buffer.from(part, "base64url").toString("utf8"))
        return isRecord(value) ? value : null
    } catch {
        return null
    }
}

/** The key id a token header names, or null when the token is not a three-part RS256 JWT. */
export const keyIdOf = (token: string): string | null => {
    const parts = token.split(".")
    const header = parts.length === 3 ? jsonOf(parts[0] ?? "") : null
    return header?.["alg"] === "RS256" && typeof header["kid"] === "string" ? header["kid"] : null
}

const textClaim = (claims: Record<string, unknown>, name: string): string | null => {
    const value = claims[name]
    if (typeof value === "string" && value !== "") return value
    return typeof value === "number" ? String(value) : null
}

const signatureHolds = (parts: ReadonlyArray<string>, key: GithubJwk): boolean => {
    try {
        const publicKey = createPublicKey({ key: { kty: key.kty, n: key.n, e: key.e }, format: "jwk" })
        const signed = Buffer.from(`${parts[0] ?? ""}.${parts[1] ?? ""}`, "utf8")
        return verify("RSA-SHA256", signed, publicKey, Buffer.from(parts[2] ?? "", "base64url"))
    } catch {
        return false
    }
}

const windowHolds = (body: Record<string, unknown>, audience: string, at: number): boolean => {
    const aud = body["aud"]
    const audiences: ReadonlyArray<unknown> = Array.isArray(aud) ? aud : [aud]
    const exp = body["exp"]
    const nbf = body["nbf"]
    const iat = body["iat"]
    if (!audiences.includes(audience) || typeof exp !== "number" || exp * 1000 < at - SKEW_MS) return false
    return (
        !(typeof nbf === "number" && nbf * 1000 > at + SKEW_MS) &&
        !(typeof iat === "number" && iat * 1000 > at + SKEW_MS)
    )
}

/**
 * Checks a GitHub Actions OIDC token against the key set: an RS256 signature by the key the header names, GitHub as issuer, the
 * audience of this app, the time window, and the repository, id, commit and run id claims present. It answers the claims or why the
 * token is not trusted; matching them to a project is `attestationOf`.
 */
export const claimsOf = (
    token: string,
    keys: ReadonlyArray<GithubJwk>,
    now: Date,
    audience: string,
): { readonly claims: GithubClaims } | { readonly refusal: CiAttestationRefusal } => {
    const parts = token.split(".")
    const kid = keyIdOf(token)
    const key = keys.find((each) => each.kid === kid)
    if (parts.length !== 3 || key === undefined || !signatureHolds(parts, key)) return { refusal: "token" }
    const body = jsonOf(parts[1] ?? "")
    if (body === null || body["iss"] !== GITHUB_OIDC_ISSUER || !windowHolds(body, audience, now.getTime())) {
        return { refusal: "token" }
    }
    const repository = textClaim(body, "repository")
    const repositoryId = textClaim(body, "repository_id")
    const sha = textClaim(body, "sha")
    const runId = textClaim(body, "run_id")
    if (repository === null || repositoryId === null || sha === null || runId === null) return { refusal: "token" }
    return { claims: { repository, repositoryId, sha: sha.toLowerCase(), runId } }
}

/**
 * Whether verified claims vouch for a run: the token names the bound repository (and the repository id once one was seen), the
 * commit the document names (the document may carry an abbreviated sha) and the run (the document id is the GitHub run id,
 * optionally followed by `-<attempt>`).
 */
export const attestationOf = (claims: GithubClaims, request: CiAttestationRequest): CiAttestation => {
    if (claims.repository.toLowerCase() !== request.repository.toLowerCase())
        return { kind: "signed-only", reason: "repository" }
    if (request.repositoryId !== null && request.repositoryId !== claims.repositoryId) {
        return { kind: "signed-only", reason: "repository" }
    }
    if (request.commit === "" || !claims.sha.startsWith(request.commit.toLowerCase())) {
        return { kind: "signed-only", reason: "commit" }
    }
    if (request.runId !== claims.runId && !request.runId.startsWith(`${claims.runId}-`)) {
        return { kind: "signed-only", reason: "run" }
    }
    return { kind: "attested", repositoryId: claims.repositoryId }
}
