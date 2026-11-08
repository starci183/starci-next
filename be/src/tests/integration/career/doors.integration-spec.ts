import { learnersOf } from "../../fixtures/builders/identity.builder"
import { attemptDoors } from "../../world/attempt-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

const MY_EXPERIENCE = `query Mine($input: MyExperienceInput!) { myExperience(input: $input) { hiringMinVerified items { itemId } } }`
const REVIEW_QUEUE = `query Queue($input: ReviewQueueInput!) { reviewQueue(input: $input) { role counts { pending } } }`
const DECIDE = `mutation Decide($input: DecideExperienceInput!) { decideExperience(input: $input) { itemId state refusal } }`
const SUBMIT = `mutation Submit($input: SubmitExperienceInput!) { submitExperience(input: $input) { itemId state } }`
const VERIFY = `query Verify($input: VerifyExperienceInput!) { verifyExperience(input: $input) { state signerRole } }`
const UNKNOWN_ITEM = "30000000-0000-4000-8000-0000000000ff"
const LINE = { vi: "line", en: "line" }

/** The learner list as the door answers it. */
interface MyExperienceListBody {
    readonly hiringMinVerified: number
    readonly items: ReadonlyArray<unknown>
}

/** The answer of the learner list door the spec reads. */
interface MyExperienceBody {
    readonly myExperience: MyExperienceListBody
}

/**
 * Career doors (integration): the GraphQL doors of the real core app behind the real session guard. A session is required on
 * every door but the public verification, the queue and the decisions refuse a learner without the TEACHER or REVIEWER role, and
 * submitting needs Premium.
 */
describe("career doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    const nextLearner = learnersOf("c7")

    beforeEach(async () => {
        await doors.reset()
    })

    it.each([
        [MY_EXPERIENCE, { input: {} }],
        [REVIEW_QUEUE, { input: { tab: "pending" } }],
        [DECIDE, { input: { decisions: [{ itemId: UNKNOWN_ITEM, verdict: "approve" }] } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists no item for a new learner and refuses them the review queue and the decisions", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const mine = await doors.ask<MyExperienceBody>(MY_EXPERIENCE, { input: {} }, cookie)
        const queue = await doors.ask(REVIEW_QUEUE, { input: { tab: "pending" } }, cookie)
        const decide = await doors.ask(
            DECIDE,
            { input: { decisions: [{ itemId: UNKNOWN_ITEM, verdict: "approve" }] } },
            cookie,
        )

        expect(mine.data?.myExperience).toEqual({ hiringMinVerified: 3, items: [] })
        expect(queue.errors?.[0]?.extensions).toMatchObject({ code: "CAREER_REVIEW_FORBIDDEN", kind: "forbidden" })
        expect(decide.errors?.[0]?.extensions).toMatchObject({ code: "CAREER_REVIEW_FORBIDDEN", kind: "forbidden" })
    })

    it("refuses Send for review without Premium and does not find an unknown item with it", async () => {
        const free = await doors.signIn(nextLearner(), false)
        const premium = await doors.signIn(nextLearner(), true)
        const input = { input: { itemId: UNKNOWN_ITEM, line: LINE } }

        const refused = await doors.ask(SUBMIT, input, free.cookie)
        const missing = await doors.ask(SUBMIT, input, premium.cookie)

        expect(refused.errors?.[0]?.extensions).toMatchObject({ code: "CAREER_PREMIUM_REQUIRED", kind: "forbidden" })
        expect(missing.errors?.[0]?.extensions).toMatchObject({ code: "CAREER_ITEM_NOT_FOUND", kind: "not-found" })
    })

    it("answers the public verification without a session, and refuses a malformed code", async () => {
        const unknown = await doors.ask(VERIFY, { input: { code: "AAAA-BBBB-CCCC" } })
        const malformed = await doors.ask(VERIFY, { input: { code: "not a code" } })

        expect(unknown.errors?.[0]?.extensions).toMatchObject({ code: "CAREER_ITEM_NOT_FOUND", kind: "not-found" })
        expect(malformed.errors?.[0]?.extensions?.kind).toBe("invalid")
    })
})
