import { createHmac } from "node:crypto"
import { fakeIds } from "@starci/jest-preset"
import { persistPremium } from "../../fixtures/builders/lesson.builder"
import { SERVER_NOW_MS } from "../../fixtures/persistence/project.sql"
import { relayResultOf } from "../../fixtures/builders/project.builder"
import { projectModules, type ProjectWorld, useProjectWorld, worldOidcTokenOf } from "../../world/project-world.options"
import { storedStreakActionsOf } from "../../world/streak-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** A delivery as the Action sends it: the raw bytes, the timestamp, the signature over both and the run's OIDC token. */
interface SignedDelivery {
    readonly rawBody: Buffer
    readonly timestamp: string
    readonly signature: string
    readonly oidcToken: string
}

const signed = (secret: string, body: unknown, timestamp: string): SignedDelivery => {
    const rawBody = Buffer.from(JSON.stringify(body))
    const signature = `sha256=${createHmac("sha256", secret).update(timestamp).update(".").update(rawBody).digest("hex")}`
    return { rawBody, timestamp, signature, oidcToken: worldOidcTokenOf("learner/clinic", "abc1234", "gh-100-1") }
}

/** The door's two calls: the proof, then the record of the proved run. */
const deliver = async (w: ProjectWorld, project: string, delivery: SignedDelivery) => {
    await w.proof().prove({ project, ...delivery, body: delivery.rawBody })
    return w.ci().recordRun({ project, ...delivery })
}

const CREATE = {
    name: "Clinic booking",
    kind: "app" as const,
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repoUrl: "https://github.com/learner/clinic",
    locale: "en" as const,
}

const RUN = {
    runId: "gh-100-1",
    commit: "abc1234",
    passed: true,
    results: [
        {
            concept: "request-response-lifecycle",
            slot: "test",
            ref: "[request-response-lifecycle] rejects bad input",
            passed: true,
        },
        { concept: "request-response-lifecycle", slot: "probe", ref: "invalid-input", passed: true },
        { concept: "health-probe-semantics", slot: "e2e", ref: "starci/e2e/health.md", passed: true },
        { concept: "health-probe-semantics", slot: "probe", ref: "health", passed: true },
        { concept: "unit-testing-behavior", slot: "test", ref: "[unit-testing-behavior] guard rejects", passed: true },
    ],
}

/** The database clock as the signed timestamp, so a delivery is fresh whatever the host clock says. */
const serverNowOf = async (w: ProjectWorld): Promise<string> => {
    const rows = await w.db()?.query<Array<{ ms: string }>>(SERVER_NOW_MS)
    return rows?.[0]?.ms ?? ""
}

/**
 * The projects flow (integration): a learner creates a project, the machine reports practice over the relay, a GitHub-attested CI run and
 * the AI teacher's read prove the first milestone, and proof reaches the experience engine, the notification inbox and the streak
 * once, over the real database.
 */
describe("projects flow (integration)", () => {
    const world = useTestWorld({ modules: projectModules })
    const w = useProjectWorld(world)
    const ids = fakeIds()

    it("moves a milestone from practice to proof and hands proof to the rest of the app once", async () => {
        const now = await serverNowOf(w)
        const learnerId = ids.next()
        await persistPremium(w.db(), learnerId)
        const { project, ciSecret } = await w.projects().create({ learnerId, ...CREATE })
        await w.repositories().set({ learnerId, projectId: project.id, repository: "learner/clinic" })
        const lookup = { learnerId, projectId: project.id, locale: "en" } as const
        w.relay().push(
            relayResultOf({ conceptId: "request-response-lifecycle", ref: "[request-response-lifecycle] a" }),
        )

        const practising = await w.practice().sync(lookup)
        const first = await deliver(w, project.id, signed(ciSecret, RUN, now))
        const afterCi = await w.reads().milestone({ ...lookup, milestoneId: "bf-http-foundation" })
        await w.codeReads().read({
            ...lookup,
            conceptId: "unit-testing-behavior",
            location: "src/guard.spec.ts#guard",
            excerpt: "it('rejects', () => expect(guard(bad)).toBe(false))",
            explanation: "The guard test fails when the guard accepts. It checks the behaviour, not the call.",
        })
        const done = await w.reads().get(lookup)
        const replay = await deliver(w, project.id, signed(ciSecret, RUN, now))
        const items = await w.experiences().mine({ learnerId, state: null })
        const inbox = await w.notifications().page(learnerId, {})
        const actions = await storedStreakActionsOf(w.db(), learnerId)
        const proved = await w.reads().provedConcepts(learnerId)

        expect(practising).toMatchObject({ practisingConceptCount: 1, provedConceptCount: 0 })
        expect(first).toEqual({ duplicate: false, added: 5 })
        expect(afterCi.concepts.map((concept) => concept.state)).toEqual(["proved", "proved", "practising"])
        expect(done.milestones[0]).toMatchObject({ id: "bf-http-foundation", state: "done", provedCount: 3 })
        expect(done.lastCiRun).toMatchObject({ runId: "gh-100-1", commit: "abc1234", passed: true })
        expect(replay).toBeUndefined()
        expect(proved.map((item) => item.conceptId).sort((a, b) => a.localeCompare(b))).toEqual(
            [...WORLD_PROVED].sort((a, b) => a.localeCompare(b)),
        )
        expect(items.items.map((item) => item.itemType)).toContain("projects.milestone")
        expect(items.items.find((item) => item.subject === `bf-http-foundation@${project.id}`)).toMatchObject({
            state: "ai-graded",
            projectId: project.id,
        })
        expect(inbox.items.filter((item) => item.kind === "project.milestone-proved")).toHaveLength(2)
        expect(actions.filter((action) => action.shard === "projects" && action.kind === "project-run")).toHaveLength(2)
    })

    it("refuses a delivery signed with another secret and a second project without Premium", async () => {
        const now = await serverNowOf(w)
        const learnerId = ids.next()
        const { project } = await w.projects().create({ learnerId, ...CREATE })

        await expect(deliver(w, project.id, signed("b".repeat(64), RUN, now))).rejects.toMatchObject({
            code: "PROJECT_CI_SIGNATURE_INVALID",
        })
        await expect(w.projects().create({ learnerId, ...CREATE })).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })
    })

    it("keeps a project, its evidence and its secret to its owner", async () => {
        const owner = ids.next()
        const other = ids.next()
        const { project } = await w.projects().create({ learnerId: owner, ...CREATE })

        await expect(w.reads().get({ learnerId: other, projectId: project.id, locale: "en" })).rejects.toMatchObject({
            code: "PROJECT_NOT_FOUND",
        })
        await expect(w.projects().remove(other, project.id)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
        expect(await w.reads().list({ learnerId: other, locale: "en" })).toEqual([])
        await expect(w.projects().remove(owner, project.id)).resolves.toEqual({ id: project.id })
    })
})

/** The concepts the first flow proves: the first milestone's three. */
const WORLD_PROVED: ReadonlyArray<string> = [
    "request-response-lifecycle",
    "health-probe-semantics",
    "unit-testing-behavior",
]
