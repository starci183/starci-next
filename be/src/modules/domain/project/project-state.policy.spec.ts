import { Test } from "@nestjs/testing"
import { evidenceOf } from "@tests/fixtures/builders/project.builder"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { conceptOf, PROJECT_CONCEPTS } from "./project-catalog.policy"
import { slotStandingOf, conceptStandingOf, milestoneStateOf, projectStandingOf } from "./project-state.policy"

const POLICY: unique symbol = Symbol("project.project-state-policy")
const policies = { slotStandingOf, conceptStandingOf, milestoneStateOf, projectStandingOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const IDEMPOTENCY = conceptOf("idempotency")
const SAGA = conceptOf("saga")
const at = (hour: number): Date => new Date(`2026-11-08T${String(hour).padStart(2, "0")}:00:00.000Z`)

const idempotency = () => {
    if (IDEMPOTENCY === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return IDEMPOTENCY
}
const saga = () => {
    if (SAGA === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return SAGA
}

describe("slotStandingOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("is empty without results", () => {
        expect(subject.slotStandingOf("test", [])).toEqual({ slot: "test", practice: null, proof: null })
    })

    it("keeps the newest run of the relay as practice and the newest proof run apart", () => {
        const rows = [
            evidenceOf({ source: "relay", runId: "r1", at: at(8) }),
            evidenceOf({ source: "relay", runId: "r2", ref: "a", passed: true, at: at(9) }),
            evidenceOf({ source: "relay", runId: "r2", ref: "b", passed: false, at: at(9) }),
            evidenceOf({ source: "ci", runId: "c1", at: at(7) }),
            evidenceOf({ source: "server-probe", runId: "s1", at: at(10), ref: "x" }),
            evidenceOf({ slot: "probe", source: "ci", runId: "other-slot" }),
        ]

        const standing = subject.slotStandingOf("test", rows)

        expect(standing.practice).toMatchObject({ passed: false, runId: "r2", ref: "b", source: "relay" })
        expect(standing.proof).toMatchObject({ passed: true, runId: "s1", source: "server-probe" })
    })

    it("counts a signed-only CI run as practice, never as proof", () => {
        const rows = [
            evidenceOf({ source: "relay", runId: "r1", at: at(8) }),
            evidenceOf({ source: "ci-signed", runId: "g1", passed: false, at: at(9) }),
        ]

        const standing = subject.slotStandingOf("test", rows)

        expect(standing.practice).toMatchObject({ runId: "g1", source: "ci-signed" })
        expect(standing.proof).toBeNull()
        expect(
            subject.slotStandingOf("test", [
                evidenceOf({ source: "relay", runId: "r9", at: at(10) }),
                evidenceOf({ source: "ci-signed", runId: "g0", at: at(7) }),
            ]).practice,
        ).toMatchObject({ runId: "r9", source: "relay" })
    })

    it("shows the first result of a passing run", () => {
        const standing = subject.slotStandingOf("test", [evidenceOf({ ref: "only", at: at(9) })])

        expect(standing.proof).toMatchObject({ passed: true, ref: "only", commitSha: "abc1234def" })
    })
})

describe("conceptStandingOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("is todo with no result, and todo while the lesson is being written", () => {
        expect(subject.conceptStandingOf(idempotency(), [], false).state).toBe("todo")
        expect(subject.conceptStandingOf(idempotency(), [evidenceOf()], true).state).toBe("todo")
    })

    it("is practising with results from the machine only", () => {
        const rows = [
            evidenceOf({ source: "relay" }),
            evidenceOf({ slot: "probe", source: "relay", ref: "repeat-same-key" }),
        ]

        expect(subject.conceptStandingOf(idempotency(), rows, false).state).toBe("practising")
    })

    it("is practising when a proof fails or a group is missing", () => {
        expect(subject.conceptStandingOf(idempotency(), [evidenceOf({ passed: false })], false).state).toBe(
            "practising",
        )
        expect(subject.conceptStandingOf(idempotency(), [evidenceOf()], false).state).toBe("practising")
    })

    it("is proved when every group has a passing proof, a test or an e2e flow and a probe", () => {
        const rows = [
            evidenceOf({ slot: "e2e", ref: "starci/e2e/idempotency.md" }),
            evidenceOf({ slot: "probe", source: "server-probe", ref: "repeat-same-key", runId: "p1" }),
        ]

        const standing = subject.conceptStandingOf(idempotency(), rows, false)

        expect(standing.state).toBe("proved")
        expect(standing.slots.map((slot) => slot.slot)).toEqual(["test", "e2e", "probe"])
    })

    it("is proved for a structure concept by the AI read alone", () => {
        const read = evidenceOf({ conceptId: "saga", slot: "code-read", source: "ai", ref: "src/saga.go" })

        expect(subject.conceptStandingOf(saga(), [read], false).state).toBe("proved")
        expect(subject.conceptStandingOf(saga(), [{ ...read, passed: false }], false).state).toBe("practising")
    })
})

describe("milestoneStateOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const standingsOf = () => ({
        proved: subject.conceptStandingOf(
            saga(),
            [evidenceOf({ conceptId: "saga", slot: "code-read", source: "ai" })],
            false,
        ),
        untouched: subject.conceptStandingOf(idempotency(), [], false),
        started: subject.conceptStandingOf(idempotency(), [evidenceOf({ passed: false })], false),
    })

    it("is done when every concept with a lesson is proved", () => {
        const { proved, untouched } = standingsOf()

        expect(subject.milestoneStateOf([proved], new Set())).toBe("done")
        expect(subject.milestoneStateOf([proved, untouched], new Set(["idempotency"]))).toBe("done")
    })

    it("is in progress once a concept has results, and todo before", () => {
        const { proved, untouched, started } = standingsOf()

        expect(subject.milestoneStateOf([proved, untouched], new Set())).toBe("in-progress")
        expect(subject.milestoneStateOf([started], new Set())).toBe("in-progress")
        expect(subject.milestoneStateOf([untouched], new Set())).toBe("todo")
        expect(subject.milestoneStateOf([], new Set())).toBe("todo")
        expect(subject.milestoneStateOf([untouched], new Set(["idempotency"]))).toBe("todo")
    })
})

describe("projectStandingOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const allLessons = new Set(["saga", "idempotency", "request-response-lifecycle"])

    it("lists the milestones of the kind, counts a shared concept once and finds the current milestone", () => {
        const standing = subject.projectStandingOf("app", [], allLessons)

        expect(standing.milestones.map((milestone) => milestone.definition.id)[0]).toBe("bf-http-foundation")
        expect(standing.conceptCount).toBe(3)
        expect(standing.provedConceptIds).toEqual([])
        expect(standing.currentMilestoneId).toBe("bf-http-foundation")
    })

    it("proves a concept once however many milestones list it, and reports practice", () => {
        const rows = [
            evidenceOf({ conceptId: "saga", slot: "code-read", source: "ai" }),
            evidenceOf({ conceptId: "request-response-lifecycle", source: "relay" }),
        ]

        const standing = subject.projectStandingOf("app", rows, allLessons)

        expect(standing.provedConceptIds).toEqual(["saga"])
        expect(standing.practisingConceptIds).toEqual(["request-response-lifecycle"])
        expect(
            standing.milestones.find((milestone) => milestone.definition.id === "sd-reliable-messaging")?.state,
        ).toBe("in-progress")
    })

    it("has no current milestone when every milestone is done", () => {
        const rows = PROJECT_CONCEPTS.flatMap((concept) =>
            concept.requires.map((group) =>
                evidenceOf({
                    conceptId: concept.id,
                    slot: group[0] ?? "test",
                    source: group[0] === "code-read" ? "ai" : "ci",
                    ref: `${concept.id}-${String(group[0])}`,
                }),
            ),
        )

        const standing = subject.projectStandingOf(
            "agent",
            rows,
            new Set(PROJECT_CONCEPTS.map((concept) => concept.id)),
        )

        expect(standing.milestones.every((milestone) => milestone.state === "done")).toBe(true)
        expect(standing.currentMilestoneId).toBeNull()
    })
})
