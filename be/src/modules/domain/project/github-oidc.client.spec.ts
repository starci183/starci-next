import { generateKeyPairSync, sign, type JsonWebKey } from "node:crypto"
import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import { GITHUB_OIDC_ISSUER } from "./github-oidc.policy"
import { GithubOidcClient } from "./github-oidc.client"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 })
const KEYS: ReadonlyArray<JsonWebKey> = [{ ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256" }]
const NOW = 1_800_000_000

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url")

const tokenOf = (audience: string): string => {
    const head = encode({ alg: "RS256", kid: "k1", typ: "JWT" })
    const body = encode({
        iss: GITHUB_OIDC_ISSUER,
        aud: audience,
        exp: NOW + 300,
        nbf: NOW - 10,
        repository: "learner/agent",
        repository_id: "42",
        sha: "abc1234abc1234abc1234abc1234abc1234abc12",
        run_id: "777",
        run_attempt: "1",
    })
    return `${head}.${body}.${sign("RSA-SHA256", Buffer.from(`${head}.${body}`), privateKey).toString("base64url")}`
}

const request = (audience: string) => ({
    token: tokenOf(audience),
    repository: "learner/agent",
    repositoryId: null,
    commit: "abc1234abc1234abc1234abc1234abc1234abc12",
    runId: "777-1",
})

const build = async (options: ProjectOptions = {}) => {
    const http = mock<HttpClient>()
    http.request.mockResolvedValue({ status: 200, body: { keys: KEYS } } as never)
    const moduleRef = await Test.createTestingModule({
        providers: [
            GithubOidcClient,
            { provide: HTTP_CLIENT, useValue: http },
            { provide: CLOCK, useValue: new FakeClock(new Date(NOW * 1000)) },
            { provide: PROJECT_OPTIONS, useValue: options },
        ],
    }).compile()
    return moduleRef.get(GithubOidcClient)
}

describe("GithubOidcClient audience", () => {
    it("verifies the one fixed audience starci-next when no audience is configured, and refuses another", async () => {
        const client = await build()

        await expect(client.attest(request("starci-next"))).resolves.toEqual({ kind: "attested", repositoryId: "42" })
        await expect(client.attest(request("https://api.example.test"))).resolves.toEqual({
            kind: "signed-only",
            reason: "token",
        })
    })

    it("verifies the audience of the deployment when ciOidcAudience names one, the same value the CLI asks GitHub for", async () => {
        const client = await build({ ciOidcAudience: "https://api.example.test" })

        await expect(client.attest(request("https://api.example.test"))).resolves.toEqual({
            kind: "attested",
            repositoryId: "42",
        })
        await expect(client.attest(request("starci-next"))).resolves.toEqual({ kind: "signed-only", reason: "token" })
    })
})
