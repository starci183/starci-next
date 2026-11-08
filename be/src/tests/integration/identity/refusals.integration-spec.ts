import { learnersOf, type RefusalBody } from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const VERIFY = { challenge: "c", code: "123456" }

/**
 * identity door refusals (integration): every door refuses a missing or foreign Origin, malformed and unexpected bodies
 * are refused before any provider call, and the strict rate tier answers 429 before the door runs.
 */
describe("identity door refusals (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a5")

    beforeEach(() => doors().reset())

    it.each([
        ["/api/identity/sign-in", { identifier: "a", password: "b" }],
        ["/api/identity/sign-in/verify", VERIFY],
        ["/api/identity/challenge/resend", { challenge: "c" }],
        ["/api/identity/sign-up", { email: "a@starci.test", password: "secret", acceptTerms: true }],
        ["/api/identity/sign-up/verify", VERIFY],
        ["/api/identity/password-reset", { email: "a@starci.test" }],
        ["/api/identity/password-reset/verify", { ...VERIFY, password: "secret" }],
        ["/api/identity/social/start", { provider: "github" }],
        ["/api/identity/social/exchange", { code: "c", state: "s" }],
        ["/api/identity/session/sign-out", undefined],
    ])("refuses %s without an allowed Origin", async (path, body) => {
        const core = world.apps.core?.api
        const absent = await core?.post<RefusalBody>(path, body)
        const foreign = await core?.post<RefusalBody>(path, body, { headers: { origin: "https://evil.test" } })

        expect([absent?.status, absent?.body.code]).toEqual([403, "HTTP_SECURITY_ORIGIN_REJECTED"])
        expect([foreign?.status, foreign?.body.code]).toEqual([403, "HTTP_SECURITY_ORIGIN_REJECTED"])
    })

    it("refuses malformed or unexpected bodies before any provider call", async () => {
        const calls = (await doors().idp.requests()).length

        const missing = await doors().post<RefusalBody>("/api/identity/sign-in", {})
        const extra = await doors().post<RefusalBody>("/api/identity/sign-in", { ...nextLearner(), admin: true })
        const code = await doors().post<RefusalBody>("/api/identity/sign-in/verify", { ...VERIFY, code: "12345a" })

        expect([missing, extra, code].map((r) => [r.status, r.body.code])).toEqual(
            Array(3).fill([400, "HTTP_SECURITY_REQUEST_INVALID"]),
        )
        await expect(doors().idp.requests()).resolves.toHaveLength(calls)
    })

    it("rate limits the strict tier before the door runs", async () => {
        const results = await Promise.all(Array.from({ length: 31 }, () => doors().post("/api/identity/sign-in", {})))
        const statuses = results.map((result) => result.status)

        expect(statuses.filter((status) => status === 400)).toHaveLength(30)
        expect(statuses.filter((status) => status === 429)).toHaveLength(1)
    })
})
