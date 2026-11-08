import {
    learnersOf,
    type ChallengeBody,
    type Learner,
    type RefusalBody,
} from "../../fixtures/builders/identity.builder"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import { identityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const SEALED_CONSUMED = sql`SELECT count(*)::int AS n FROM identity_challenges WHERE consumed_at IS NOT NULL AND payload <> ''`
/** The count a `count(*)::int AS n` query answers, or -1 when the world runs no primary database. */
const countOf = async (manager: EntityManager | undefined, query: ReturnType<typeof sql>): Promise<number> => {
    const rows: Array<{ n: number }> = (await manager?.query(query)) ?? []
    return rows[0]?.n ?? -1
}
const SEALED_LIVE = sql`SELECT count(*)::int AS n FROM identity_challenges WHERE consumed_at IS NULL AND payload <> ''`

/**
 * identity challenge doors (integration): the attempts of an emailed-code challenge count down and run out, a resend
 * restores them with a fresh code, an unknown challenge is expired, and two concurrent verifies of one code cannot both win.
 */
describe("identity challenge doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("a2")
    const open = async (learner: Learner) => {
        await doors().seed(learner)
        const opened = await doors().post<ChallengeBody>("/api/identity/sign-in", {
            identifier: learner.username,
            password: learner.password,
        })
        return { challenge: opened.body.challenge, code: await doors().codeSentTo(learner.email) }
    }
    const verify = (challenge: string, code: string) =>
        doors().post<RefusalBody>("/api/identity/sign-in/verify", { challenge, code })

    beforeEach(() => doors().reset())

    it("counts attempts down on a wrong code, then refuses the exhausted challenge as expired", async () => {
        const { challenge, code } = await open(nextLearner())
        const wrong = code === "000000" ? "111111" : "000000"

        const first = await verify(challenge, wrong)
        const rest = [await verify(challenge, wrong), await verify(challenge, wrong), await verify(challenge, wrong)]
        const last = await verify(challenge, wrong)
        const exhausted = await verify(challenge, code)

        expect([first.status, first.body.code, first.body.params]).toEqual([
            400,
            "IDENTITY_CODE_MISMATCH",
            { attemptsLeft: 4 },
        ])
        expect([...rest, last].map((result) => result.status)).toEqual([400, 400, 400, 400])
        expect([exhausted.status, exhausted.body.code]).toEqual([404, "IDENTITY_CHALLENGE_EXPIRED"])
    })

    it("resends a fresh code that works, restoring the attempts", async () => {
        const learner = nextLearner()
        const { challenge } = await open(learner)
        await verify(challenge, "000000")

        const resent = await doors().post("/api/identity/challenge/resend", { challenge })
        const verified = await verify(challenge, await doors().codeSentTo(learner.email))

        expect(resent.status).toBe(204)
        expect(await world.mail.messages(learner.email)).toHaveLength(2)
        expect(verified.status).toBe(204)
    })

    it("refuses an unknown challenge as expired on verify and resend", async () => {
        const unknown = "u".repeat(43)

        const verified = await verify(unknown, "123456")
        const resent = await doors().post<RefusalBody>("/api/identity/challenge/resend", { challenge: unknown })

        expect([verified.status, resent.status]).toEqual([404, 404])
        expect([verified.body.code, resent.body.code]).toEqual(Array(2).fill("IDENTITY_CHALLENGE_EXPIRED"))
    })

    it("lets exactly one of two concurrent verifies win and persists one session", async () => {
        const before = await doors().activeSessions()
        const { challenge, code } = await open(nextLearner())

        const results = await Promise.all([verify(challenge, code), verify(challenge, code)])

        expect(results.map((result) => result.status).sort((a, b) => a - b)).toEqual([204, 404])
        expect(results.filter((result) => result.headers["set-cookie"] !== undefined)).toHaveLength(1)
        await expect(doors().activeSessions()).resolves.toBe(before + 1)
    })

    it("blanks the sealed payload of a challenge in the statement that consumes it, and keeps it while it is live", async () => {
        const { challenge, code } = await open(nextLearner())
        const liveBefore = await countOf(world.db.primary, SEALED_LIVE)

        const verified = await verify(challenge, code)

        expect(verified.status).toBe(204)
        expect(liveBefore).toBeGreaterThan(0)
        await expect(countOf(world.db.primary, SEALED_CONSUMED)).resolves.toBe(0)
    })
})
