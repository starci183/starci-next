import { createSign, generateKeyPairSync } from "node:crypto"
import { Test } from "@nestjs/testing"
import { FakeClock, mock } from "@starci/jest-preset"
import { CLOCK } from "@modules/platform/clock"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { GITHUB_OIDC_ISSUER } from "./github-oidc.policy"
import { GithubOidcCiClient } from "./github-oidc-ci.client"
import { PROJECT_OPTIONS } from "./project.decorators"

const NOW = new Date("2026-11-17T03:00:00.000Z")
const pair = generateKeyPairSync("rsa", { modulusLength: 2048 })
const exported = pair.publicKey.export({ format: "jwk" })
const JWKS = { keys: [{ kid: "k1", kty: "RSA", n: exported.n, e: exported.e }] }
const segment = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString("base64url")

const tokenOf = (kid = "k1"): string => {
    const head = segment({ alg: "RS256", kid })
    const body = segment({
        iss: GITHUB_OIDC_ISSUER,
        aud: "starci-next",
        exp: NOW.getTime() / 1000 + 600,
        repository: "learner/agent",
        repository_id: "42",
        sha: "abc1234abc1234abc1234abc1234abc1234abc12",
        run_id: "777",
    })
    return `${head}.${body}.${createSign("RSA-SHA256").update(`${head}.${body}`).sign(pair.privateKey).toString("base64url")}`
}

const REQUEST = { token: "", repository: "learner/agent", repositoryId: null, commit: "abc1234", runId: "777-1" }

const build = async () => {
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            GithubOidcCiClient,
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: PROJECT_OPTIONS, useValue: {} },
        ],
    }).compile()
    return { client: moduleRef.get(GithubOidcCiClient), logger }
}

describe("GithubOidcCiClient", () => {
    afterEach(() => {
        jest.restoreAllMocks()
    })

    it("attests a run whose token GitHub signed, reading the key set once and keeping it", async () => {
        const fetched = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(JWKS)))
        const { client } = await build()

        const first = await client.attest({ ...REQUEST, token: tokenOf() })
        const second = await client.attest({ ...REQUEST, token: tokenOf() })

        expect(first).toEqual({ kind: "attested", repositoryId: "42" })
        expect(second).toEqual({ kind: "attested", repositoryId: "42" })
        expect(fetched).toHaveBeenCalledTimes(1)
    })

    it("leaves the run signed-only when GitHub cannot be reached, and logs it", async () => {
        jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"))
        const { client, logger } = await build()

        await expect(client.attest({ ...REQUEST, token: tokenOf() })).resolves.toEqual({
            kind: "signed-only",
            reason: "unavailable",
        })

        expect(logger.warn).toHaveBeenCalled()
    })

    it("leaves the run signed-only for a token that is not a JWT or names a key GitHub does not publish", async () => {
        jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(JWKS)))
        const { client } = await build()

        await expect(client.attest({ ...REQUEST, token: "garbage" })).resolves.toEqual({
            kind: "signed-only",
            reason: "token",
        })
        await expect(client.attest({ ...REQUEST, token: tokenOf("ghost") })).resolves.toEqual({
            kind: "signed-only",
            reason: "token",
        })
    })

    it("leaves the run signed-only when the token names another repository", async () => {
        jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(JWKS)))
        const { client } = await build()

        await expect(client.attest({ ...REQUEST, token: tokenOf(), repository: "someone/else" })).resolves.toEqual({
            kind: "signed-only",
            reason: "repository",
        })
    })
})
