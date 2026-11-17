import { Test } from "@nestjs/testing"
import { evidenceOf } from "@tests/fixtures/builders/project.builder"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { SLOT_PROOF_SOURCES, type EvidenceSlot } from "./project.contracts"
import { fixtureCheckSet } from "@tests/fixtures/builders/check-set.builder"
import { conceptIn } from "./project-check-set-lookup.policy"
import { slotStandingOf, conceptStandingOf, milestoneStateOf, projectStandingOf } from "./project-state.policy"

const SET = fixtureCheckSet()
const conceptOf = (id: string) => conceptIn(SET, id)
const POLICY: unique symbol = Symbol("project.project-state-policy")
const policies = { slotStandingOf, conceptStandingOf, milestoneStateOf, projectStandingOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const IDEMPOTENCY = conceptOf("idempotent-retry")
const SAGA = conceptOf("unit-testing-behavior")

/** One passing proof row per group of what a concept requires, from the first slot of the group and the one source that may prove it. */
const proofRowsOf = (conceptId: string, hour = 9, runId = "proof") => {
    const definition = conceptOf(conceptId)
    if (definition === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return definition.requires.map((group: ReadonlyArray<EvidenceSlot>) => {
        const slot: EvidenceSlot = group[0] ?? "test"
        const source = SLOT_PROOF_SOURCES[slot][0] ?? "ci"
        return evidenceOf({
            conceptId,
            slot,
            source,
            runId: `${runId}-${slot}`,
            ref: `${conceptId}-${slot}`,
            at: at(hour),
        })
    })
}
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
            evidenceOf({ source: "ci", runId: "c2", at: at(10), ref: "x" }),
            evidenceOf({ slot: "probe", source: "ci", runId: "other-slot" }),
        ]

        const standing = subject.slotStandingOf("test", rows)

        expect(standing.practice).toMatchObject({ passed: false, runId: "r2", ref: "b", source: "relay" })
        expect(standing.proof).toMatchObject({ passed: true, runId: "c2", source: "ci" })
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

    it("is proved for a structure concept by a test and the AI read, and by neither alone", () => {
        const [test, read] = proofRowsOf("unit-testing-behavior")
        if (test === undefined || read === undefined) throw new Error("saga has two groups")

        expect(subject.conceptStandingOf(saga(), [test, read], false).state).toBe("proved")
        expect(subject.conceptStandingOf(saga(), [test], false).state).toBe("practising")
        expect(subject.conceptStandingOf(saga(), [read], false).state).toBe("practising")
        expect(subject.conceptStandingOf(saga(), [test, { ...read, passed: false }], false).state).toBe("practising")
    })
})

describe("milestoneStateOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const standingsOf = () => ({
        proved: subject.conceptStandingOf(saga(), proofRowsOf("unit-testing-behavior"), false),
        untouched: subject.conceptStandingOf(idempotency(), [], false),
        started: subject.conceptStandingOf(idempotency(), [evidenceOf({ passed: false })], false),
    })

    it("is done when every concept with a lesson is proved", () => {
        const { proved, untouched } = standingsOf()

        expect(subject.milestoneStateOf([proved], new Set())).toBe("done")
        expect(subject.milestoneStateOf([proved, untouched], new Set(["idempotent-retry"]))).toBe("done")
    })

    it("is in progress once a concept has results, and todo before", () => {
        const { proved, untouched, started } = standingsOf()

        expect(subject.milestoneStateOf([proved, untouched], new Set())).toBe("in-progress")
        expect(subject.milestoneStateOf([started], new Set())).toBe("in-progress")
        expect(subject.milestoneStateOf([untouched], new Set())).toBe("todo")
        expect(subject.milestoneStateOf([], new Set())).toBe("todo")
        expect(subject.milestoneStateOf([untouched], new Set(["idempotent-retry"]))).toBe("todo")
    })
})

describe("projectStandingOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const allLessons = new Set(["unit-testing-behavior", "idempotent-retry", "request-response-lifecycle"])

    it("lists the milestones of the kind, counts a shared concept once and finds the current milestone", () => {
        const standing = subject.projectStandingOf(SET, "app", [], allLessons)

        expect(standing.milestones.map((milestone) => milestone.definition.id)[0]).toBe("bf-http-foundation")
        expect(standing.conceptCount).toBe(10)
        expect(standing.provedConceptIds).toEqual([])
        expect(standing.currentMilestoneId).toBe("bf-http-foundation")
    })

    it("leaves a concept that needs the AI read out of the count while no lesson can grade it", () => {
        const standing = subject.projectStandingOf(SET, "app", [], new Set())

        expect(standing.conceptCount).toBe(9)
        expect(standing.milestones[0]?.concepts.find((c) => c.definition.id === "unit-testing-behavior")?.state).toBe(
            "todo",
        )
    })

    it("proves a concept once however many milestones list it, and reports practice", () => {
        const rows = [
            ...proofRowsOf("unit-testing-behavior"),
            evidenceOf({ conceptId: "request-response-lifecycle", source: "relay" }),
        ]

        const standing = subject.projectStandingOf(SET, "app", rows, allLessons)

        expect(standing.provedConceptIds).toEqual(["unit-testing-behavior"])
        expect(standing.practisingConceptIds).toEqual(["request-response-lifecycle"])
        expect(standing.milestones.find((milestone) => milestone.definition.id === "bf-http-foundation")?.state).toBe(
            "in-progress",
        )
    })

    it("has no current milestone when every milestone is done", () => {
        const rows = SET.concepts.flatMap((concept) => proofRowsOf(concept.id))

        const standing = subject.projectStandingOf(
            SET,
            "agent",
            rows,
            new Set(SET.concepts.map((concept) => concept.id)),
        )

        expect(standing.milestones.every((milestone) => milestone.state === "done")).toBe(true)
        expect(standing.currentMilestoneId).toBeNull()
    })
})
