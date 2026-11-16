import { generateKeyPairSync, sign, type JsonWebKey } from "node:crypto"
import { attestationOf, GITHUB_OIDC_ISSUER } from "./github-oidc.policy"

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
const KEYS: ReadonlyArray<JsonWebKey> = [{ ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256" }]
const NOW = 1_800_000_000

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url")

const tokenOf = (claims: Record<string, unknown>, kid = "k1"): string => {
    const head = encode({ alg: "RS256", kid, typ: "JWT" })
    const body = encode({
        iss: GITHUB_OIDC_ISSUER,
        aud: "starci-next",
        exp: NOW + 300,
        nbf: NOW - 10,
        repository: "Hocvien/Dat-Lich",
        repository_id: "42",
        sha: "abc1234abc1234abc1234abc1234abc1234abc12",
        run_id: "100",
        run_attempt: "1",
        ...claims,
    })
    return `${head}.${body}.${sign("RSA-SHA256", Buffer.from(`${head}.${body}`), privateKey).toString("base64url")}`
}

const request = (token: string, repositoryId: string | null = null) => ({
    token,
    repository: "hocvien/dat-lich",
    repositoryId,
    commit: "ABC1234ABC1234ABC1234ABC1234ABC1234ABC12",
    runId: "100-1",
})

describe("attestationOf", () => {
    it("attests a run whose GitHub token names the bound repository, the commit and the run", () => {
        expect(attestationOf(request(tokenOf({})), KEYS, "starci-next", NOW)).toEqual({
            kind: "attested",
            repositoryId: "42",
        })
    })

    it.each([
        ["a forged signature", `${tokenOf({}).slice(0, -6)}AAAAAA`, "token"],
        ["an unknown key", tokenOf({}, "k2"), "token"],
        ["another issuer", tokenOf({ iss: "https://evil.example" }), "token"],
        ["another audience", tokenOf({ aud: "someone-else" }), "token"],
        ["an expired token", tokenOf({ exp: NOW - 600 }), "token"],
        ["another repository", tokenOf({ repository: "other/repo" }), "repository"],
        ["another commit", tokenOf({ sha: "0".repeat(40) }), "commit"],
        ["another run", tokenOf({ run_id: "101" }), "run"],
        ["not a token", "abc", "token"],
    ])("leaves %s signed-only", (_name, token, reason) => {
        expect(attestationOf(request(token), KEYS, "starci-next", NOW)).toEqual({ kind: "signed-only", reason })
    })

    it("refuses a token naming another repository id once the binding knows its id", () => {
        expect(attestationOf(request(tokenOf({}), "43"), KEYS, "starci-next", NOW)).toEqual({
            kind: "signed-only",
            reason: "repository",
        })
    })
})
