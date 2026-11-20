import { randomBytes } from "node:crypto"
import { learnersOf, type RefusalBody } from "../../fixtures/builders/learner.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** A password generated for the run: no secret literal exists. */
const PASSWORD = randomBytes(12).toString("hex")

/**
 * identity door refusals (integration): every door refuses a missing or foreign Origin, malformed and unexpected bodies
 * are refused before any account is read, and the strict rate tier answers 429 before the door runs.
 */
describe("identity door refusals (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a5")

    beforeEach(() => doors().reset())

    it.each([
        ["/auth/login", { email: "a@starci.test", password: PASSWORD }],
        ["/auth/signup", { email: "a@starci.test", password: PASSWORD }],
        ["/auth/resend", { email: "a@starci.test" }],
        ["/auth/confirm", { token: "t".repeat(32) }],
        ["/auth/forgot", { email: "a@starci.test" }],
        ["/auth/reset", { token: "t".repeat(32), password: PASSWORD }],
        ["/auth/refresh", undefined],
        ["/auth/logout", undefined],
    ])("refuses %s without an allowed Origin", async (path, body) => {
        const core = world.apps.core?.api
        const absent = await core?.post<RefusalBody>(path, body)
        const foreign = await core?.post<RefusalBody>(path, body, { headers: { origin: "https://evil.test" } })

        expect([absent?.status, absent?.body.code]).toEqual([403, "HTTP_SECURITY_ORIGIN_REJECTED"])
        expect([foreign?.status, foreign?.body.code]).toEqual([403, "HTTP_SECURITY_ORIGIN_REJECTED"])
    })

    it("refuses malformed or unexpected bodies", async () => {
        const missing = await doors().post<RefusalBody>("/auth/login", {})
        const extra = await doors().post<RefusalBody>("/auth/login", { ...nextLearner(), admin: true })
        const token = await doors().post<RefusalBody>("/auth/confirm", { token: "short" })

        expect([missing, extra, token].map((r) => [r.status, r.body.code])).toEqual(
            Array(3).fill([400, "HTTP_SECURITY_REQUEST_INVALID"]),
        )
    })

    it("rate limits the strict tier before the door runs", async () => {
        const results = await Promise.all(Array.from({ length: 31 }, () => doors().post("/auth/login", {})))
        const statuses = results.map((result) => result.status)

        expect(statuses.filter((status) => status === 400)).toHaveLength(30)
        expect(statuses.filter((status) => status === 429)).toHaveLength(1)
    })
})
