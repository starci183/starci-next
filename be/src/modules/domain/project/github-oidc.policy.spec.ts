import { createSign, generateKeyPairSync } from "node:crypto"
import { Test } from "@nestjs/testing"
import { GITHUB_OIDC_ISSUER, attestationOf, claimsOf, jwksOf, keyIdOf, type GithubJwk } from "./github-oidc.policy"

const POLICY = Symbol("github-oidc-policy")

const policies = { attestationOf, claimsOf, jwksOf, keyIdOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const NOW = new Date("2026-11-17T03:00:00.000Z")
const AUDIENCE = "starci-next"
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 })
const other = generateKeyPairSync("rsa", { modulusLength: 2048 })
const jwkOf = (kid: string, key: typeof pair): GithubJwk => {
    const exported = key.publicKey.export({ format: "jwk" })
    return { kid, kty: "RSA", n: String(exported.n), e: String(exported.e) }
}
const KEYS = [jwkOf("k1", pair)]
const segment = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url")

const tokenOf = (
    claims: Record<string, unknown> = {},
    signer: typeof pair = pair,
    header: Record<string, unknown> = {},
): string => {
    const head = segment({ alg: "RS256", kid: "k1", ...header })
    const body = segment({
        iss: GITHUB_OIDC_ISSUER,
        aud: AUDIENCE,
        exp: NOW.getTime() / 1000 + 600,
        iat: NOW.getTime() / 1000 - 5,
        repository: "learner/agent",
        repository_id: "42",
        sha: "ABC1234ABC1234ABC1234ABC1234ABC1234ABC12",
        run_id: "777",
        ...claims,
    })
    const signature = createSign("RSA-SHA256").update(`${head}.${body}`).sign(signer.privateKey).toString("base64url")
    return `${head}.${body}.${signature}`
}

describe("claimsOf", () => {
    it("reads the claims of a token GitHub signed for this app and lower-cases the sha", async () => {
        const { claimsOf: claims } = await build()

        expect(claims(tokenOf(), KEYS, NOW, AUDIENCE)).toEqual({
            claims: {
                repository: "learner/agent",
                repositoryId: "42",
                sha: "abc1234abc1234abc1234abc1234abc1234abc12",
                runId: "777",
            },
        })
    })

    it.each([
        ["a signature by another key", () => tokenOf({}, other)],
        ["another issuer", () => tokenOf({ iss: "https://evil.example" })],
        ["another audience", () => tokenOf({ aud: "somebody-else" })],
        ["an expired token", () => tokenOf({ exp: NOW.getTime() / 1000 - 3600 })],
        ["a token not valid yet", () => tokenOf({ nbf: NOW.getTime() / 1000 + 3600 })],
        ["a key id GitHub does not publish", () => tokenOf({}, pair, { kid: "ghost" })],
        ["an algorithm other than RS256", () => tokenOf({}, pair, { alg: "none" })],
        ["no repository claim", () => tokenOf({ repository: undefined })],
        ["a token that is not three parts", () => "a.b"],
    ])("refuses %s", async (_name, token) => {
        const { claimsOf: claims } = await build()

        expect(claims(token(), KEYS, NOW, AUDIENCE)).toEqual({ refusal: "token" })
    })

    it("accepts an audience list that names this app", async () => {
        const { claimsOf: claims } = await build()

        expect(claims(tokenOf({ aud: ["x", AUDIENCE] }), KEYS, NOW, AUDIENCE)).toHaveProperty("claims")
    })
})

describe("attestationOf", () => {
    const claims = { repository: "learner/agent", repositoryId: "42", sha: "abc1234abc", runId: "777" }
    const request = { token: "t", repository: "Learner/Agent", repositoryId: null, commit: "ABC1234", runId: "777-2" }

    it("attests a run whose token names the bound repository, the commit and the run, and reports the repository id", async () => {
        const { attestationOf: attest } = await build()

        expect(attest(claims, request)).toEqual({ kind: "attested", repositoryId: "42" })
        expect(attest(claims, { ...request, runId: "777", repositoryId: "42" })).toEqual({
            kind: "attested",
            repositoryId: "42",
        })
    })

    it.each([
        ["another repository", { repository: "someone/else" }, "repository"],
        ["another repository id", { repositoryId: "43" }, "repository"],
        ["another commit", { commit: "ffffff0" }, "commit"],
        ["an empty commit", { commit: "" }, "commit"],
        ["another run", { runId: "778-1" }, "run"],
        ["a run id that only starts with the same digits", { runId: "7770" }, "run"],
    ])("leaves a run signed-only for %s", async (_name, patch, reason) => {
        const { attestationOf: attest } = await build()

        expect(attest(claims, { ...request, repositoryId: "42", ...patch })).toEqual({ kind: "signed-only", reason })
    })
})

describe("jwksOf and keyIdOf", () => {
    it("keeps only the RSA keys of a key set and reads the key id of a token header", async () => {
        const { jwksOf: keys, keyIdOf: kid } = await build()

        expect(keys({ keys: [{ kid: "a", kty: "RSA", n: "n", e: "e" }, { kid: "b", kty: "EC" }, "x"] })).toEqual([
            { kid: "a", kty: "RSA", n: "n", e: "e" },
        ])
        expect(keys("nothing")).toEqual([])
        expect(kid(tokenOf())).toBe("k1")
        expect(kid("not.a.jwt")).toBeNull()
    })
})
