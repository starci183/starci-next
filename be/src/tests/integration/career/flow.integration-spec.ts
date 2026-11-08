import { fakeIds } from "@starci/jest-preset"
import { ESSENTIALS_DRAFT, produceParamsOf } from "../../fixtures/builders/career.builder"
import { persistPremium } from "../../fixtures/builders/lesson.builder"
import { careerModules, useCareerWorld, type CareerWorld } from "../../world/career-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** A learner nobody used before in the file, with Premium. */
const premiumLearnerOf = async (w: CareerWorld, ids: ReturnType<typeof fakeIds>): Promise<string> => {
    const learner = ids.next()
    await persistPremium(w.db(), learner)
    return learner
}

/**
 * The experience lifecycle (integration): practising, ai-graded, pending review, verified or returned, then revoked, over the
 * real database. It proves the audit trail, the assignment to an appointed reviewer, the resubmit rules, the public verification
 * and that only verified items reach the read a path engine counts.
 */
describe("experience lifecycle (integration)", () => {
    const world = useTestWorld({ modules: careerModules })
    const w = useCareerWorld(world)
    const ids = fakeIds()

    const premiumLearner = (): Promise<string> => premiumLearnerOf(w, ids)

    it("verifies an item through an appointed reviewer, shows it publicly and revokes it with an audit trail", async () => {
        const learner = await premiumLearner()
        const teacher = { subject: ids.next(), roles: ["TEACHER"] }
        const reviewer = { subject: ids.next(), roles: ["REVIEWER"] }
        await w.reviewers().set({
            signer: teacher,
            reviewerId: reviewer.subject,
            parts: ["essentials"],
            capacity: null,
            conflicts: [],
            end: false,
        })

        const graded = await w.experiences().produce(produceParamsOf({ learnerId: learner }))
        const pending = await w
            .experiences()
            .submit({ learnerId: learner, itemId: graded.itemId, line: ESSENTIALS_DRAFT })
        const queue = await w.reads().queue(reviewer, "pending")
        const [decided] = await w
            .reviews()
            .decide({ signer: reviewer, decisions: [{ itemId: graded.itemId, verdict: "approve", note: null }] })
        const verified = await w.reads().verify(graded.verificationCode)
        const counted = await w.reads().verifiedItems(learner)
        await w.experiences().show({ learnerId: learner, itemId: graded.itemId, shownPublicly: true })
        await w.reviews().revoke({ signer: teacher, itemId: graded.itemId, reason: "Wrong evidence" })
        const revoked = await w.reads().verify(graded.verificationCode)
        const audit = await w.reads().item(teacher, graded.itemId)

        expect(graded).toMatchObject({ state: "ai-graded", draftLine: ESSENTIALS_DRAFT })
        expect(graded.verificationCode).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/u)
        expect(pending.state).toBe("pending-review")
        expect(queue.items.map((item) => item.itemId)).toEqual([graded.itemId])
        expect(decided).toEqual({ itemId: graded.itemId, state: "verified", refusal: null })
        expect(verified).toMatchObject({
            state: "verified",
            signerRole: "REVIEWER",
            line: ESSENTIALS_DRAFT,
            revokedAt: null,
        })
        expect(JSON.stringify(verified)).not.toContain(learner)
        expect(counted.map((item) => item.itemId)).toEqual([graded.itemId])
        expect(revoked.state).toBe("revoked")
        expect(await w.reads().verifiedItems(learner)).toEqual([])
        expect(audit.history.map((row) => [row.action, row.actorRole, row.toState])).toEqual([
            ["grade", "system", "ai-graded"],
            ["submit", "learner", "pending-review"],
            ["approve", "REVIEWER", "verified"],
            ["revoke", "TEACHER", "revoked"],
        ])
    })
})

/** Returns and resubmits (integration): a return needs a note and an unchanged resubmit is refused. */
describe("experience returns and resubmits (integration)", () => {
    const world = useTestWorld({ modules: careerModules })
    const w = useCareerWorld(world)
    const ids = fakeIds()

    const premiumLearner = (): Promise<string> => premiumLearnerOf(w, ids)

    it("returns with a note, refuses an unchanged resubmit and sends a reworded one back to the queue", async () => {
        const learner = await premiumLearner()
        const teacher = { subject: ids.next(), roles: ["TEACHER"] }
        const graded = await w
            .experiences()
            .produce(produceParamsOf({ learnerId: learner, subject: `s-${ids.next()}` }))
        await w.experiences().submit({ learnerId: learner, itemId: graded.itemId, line: ESSENTIALS_DRAFT })

        const refused = await w
            .reviews()
            .decide({ signer: teacher, decisions: [{ itemId: graded.itemId, verdict: "return", note: null }] })
        await w.reviews().decide({
            signer: teacher,
            decisions: [{ itemId: graded.itemId, verdict: "return", note: "Missing evidence" }],
        })
        const mine = await w.reads().mine({ learnerId: learner, state: "returned" })
        const unchanged = w.experiences().submit({ learnerId: learner, itemId: graded.itemId, line: ESSENTIALS_DRAFT })
        const reworded = { ...ESSENTIALS_DRAFT, vi: `${ESSENTIALS_DRAFT.vi} With tests attached.` }

        expect(refused[0]?.refusal).toBe("CAREER_REVIEW_NOTE_REQUIRED")
        expect(mine.items[0]).toMatchObject({ state: "returned", returnNote: "Missing evidence", returnCount: 1 })
        await expect(unchanged).rejects.toMatchObject({ code: "CAREER_RESUBMIT_UNCHANGED" })
        await expect(
            w.experiences().submit({ learnerId: learner, itemId: graded.itemId, line: reworded }),
        ).resolves.toMatchObject({
            state: "pending-review",
        })
        const pending = await w.reads().queue(teacher, "pending")
        expect(pending.items.map((item) => item.itemId)).toContain(graded.itemId)
    })
})

/** The Premium and self-review refusals of the lifecycle (integration), over the real database. */
describe("experience lifecycle refusals (integration)", () => {
    const world = useTestWorld({ modules: careerModules })
    const w = useCareerWorld(world)
    const ids = fakeIds()

    it("refuses Send for review without Premium and keeps a learner from signing their own item", async () => {
        const free = ids.next()
        const graded = await w.experiences().produce(produceParamsOf({ learnerId: free }))
        const self = { subject: free, roles: ["TEACHER"] }

        await expect(
            w.experiences().submit({ learnerId: free, itemId: graded.itemId, line: ESSENTIALS_DRAFT }),
        ).rejects.toMatchObject({ code: "CAREER_PREMIUM_REQUIRED" })
        await expect(w.reads().item(self, graded.itemId)).rejects.toMatchObject({ code: "CAREER_SELF_REVIEW" })
    })
})
