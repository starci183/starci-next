import {
    SESSION_DELETED,
    UNKNOWN_COOKIE,
    keysOf,
    learnersOf,
    type RefusalBody,
    type SessionBody,
} from "../../fixtures/builders/identity.builder"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * identity session (integration): the cookie session of the real core app. It proves the read of a live session carries the
 * provider-asserted roles, the learner's display name and email from the verified token, and no token, an absent or unknown caller is 401 with the cookie cleared, sign-out revokes the
 * durable row and clears the cookie even without one, and a cut session store fails the read closed.
 */
describe("identity session (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a6")

    beforeEach(() => doors().reset())

    it("reads a live session as its subject, provider roles, name, email and expiry, with no token", async () => {
        const learner = nextLearner()
        const cookie = await doors().signIn(learner)

        const read = await doors().get<SessionBody>("/api/identity/session", { cookie })

        expect(read.status).toBe(200)
        expect(keysOf(read.body)).toEqual(["expiresAt", "identity"])
        expect(keysOf(read.body.identity)).toEqual(["displayName", "email", "roles", "subject"])
        expect(read.body.identity.roles).toContain("member")
        expect([read.body.identity.displayName, read.body.identity.email]).toEqual([learner.username, learner.email])
        expect(Number.isNaN(Date.parse(read.body.expiresAt))).toBe(false)
        expect(read.headers["cache-control"]).toBe("no-store")
        expect(JSON.stringify(read.body)).not.toMatch(/token|password/iu)
    })

    it("keeps the name and email on the session row, so every later read answers them", async () => {
        const learner = nextLearner()
        const cookie = await doors().signIn(learner)

        const first = await doors().get<SessionBody>("/api/identity/session", { cookie })
        const second = await doors().get<SessionBody>("/api/identity/session", { cookie })

        expect(second.body.identity).toEqual(first.body.identity)
        expect(second.body.identity).toMatchObject({ displayName: learner.username, email: learner.email })
    })

    it.each([[{}], [{ cookie: UNKNOWN_COOKIE }]])("answers 401 and clears the cookie for %j", async (headers) => {
        const read = await doors().get<RefusalBody>("/api/identity/session", headers)

        expect([read.status, read.body.code]).toEqual([401, "IDENTITY_SESSION_REQUIRED"])
        expect(read.headers["set-cookie"]).toBe(SESSION_DELETED)
    })

    it("signs out: revokes the durable session, clears the cookie and then answers 401", async () => {
        const cookie = await doors().signIn(nextLearner())
        const before = await doors().activeSessions()

        const out = await doors().post("/api/identity/session/sign-out", undefined, { cookie })
        const after = await doors().get<RefusalBody>("/api/identity/session", { cookie })

        expect([out.status, out.headers["set-cookie"]]).toEqual([204, SESSION_DELETED])
        await expect(doors().activeSessions()).resolves.toBe(before - 1)
        expect([after.status, after.body.code]).toEqual([401, "IDENTITY_SESSION_REQUIRED"])
    })

    it("clears the cookie on sign-out even without a session", async () => {
        const out = await doors().post("/api/identity/session/sign-out")

        expect([out.status, out.headers["set-cookie"]]).toEqual([204, SESSION_DELETED])
    })

    it("fails the session read closed while the durable store is cut", async () => {
        await world.interruptDatabase(async () => {
            const read = await doors().get<RefusalBody>("/api/identity/session", { cookie: UNKNOWN_COOKIE })

            expect(read.status).toBeGreaterThanOrEqual(500)
            expect(read.body).not.toHaveProperty("identity")
        })
    })
})
