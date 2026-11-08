import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { Test } from "@nestjs/testing"
import {
    ciRunRowOf,
    conceptRowOf,
    evidenceDbRowOf,
    probeRunRowOf,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { conceptOf } from "./project-catalog.policy"
import { conceptStandingOf, projectStandingOf } from "./project-state.policy"
import {
    factsOf,
    projectKindOf,
    toCiRunView,
    toConceptView,
    toEvidenceRows,
    toMilestoneSummaryView,
    toProbeRunView,
    toSummaryView,
} from "./project-view.mapper"

const POLICY: unique symbol = Symbol("project.project-view-mapper")
const policies = {
    factsOf,
    projectKindOf,
    toCiRunView,
    toConceptView,
    toEvidenceRows,
    toMilestoneSummaryView,
    toProbeRunView,
    toSummaryView,
}

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const LESSON = { id: "idempotency", version: "v1", title: "Idempotency", topicId: "reliability" }

const standingOf = (rows: ReturnType<typeof toEvidenceRows>, comingSoon = false) => {
    const definition = conceptOf("idempotency")
    if (definition === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return conceptStandingOf(definition, rows, comingSoon)
}

describe("toEvidenceRows", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("maps the rows and leaves out a slot or a source the capability does not know", () => {
        const rows = subject.toEvidenceRows([
            evidenceDbRowOf(),
            evidenceDbRowOf({ slot: "lint" }),
            evidenceDbRowOf({ source: "other" }),
        ])

        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            projectId: "40000000-0000-4000-8000-0000000000a1",
            slot: "test",
            source: "ci",
            runId: "run-1",
        })
    })
})

describe("factsOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("keeps strings and numbers as text", () => {
        expect(subject.factsOf({ facts: { status: 200, reason: "ok", nested: { a: 1 }, flag: true } })).toEqual([
            { key: "status", value: "200" },
            { key: "reason", value: "ok" },
        ])
        expect(subject.factsOf({})).toEqual([])
    })
})

describe("project views", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const standing = projectStandingOf("app", [], new Set(["idempotency"]))

    it("shows a project in short", () => {
        expect(subject.toSummaryView(projectRowOf({ track: "claude", kind: "agent" }), standing)).toMatchObject({
            kind: "agent",
            track: "claude",
            conceptCount: 1,
            provedConceptCount: 0,
            currentMilestoneId: "bf-http-foundation",
            doneMilestoneCount: 0,
            milestoneCount: 11,
            createdAt: "2026-11-01T00:00:00.000Z",
        })
        expect(subject.projectKindOf(projectRowOf({ kind: "game" }))).toBe("app")
        expect(subject.toSummaryView(projectRowOf({ track: "gpt" }), standing).track).toBeNull()
    })

    it("shows a milestone pill with its locale and lock", () => {
        const launch = standing.milestones.find((milestone) => milestone.definition.id === "launch")
        if (launch === undefined) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })

        expect(subject.toMilestoneSummaryView(launch, "vi", true)).toEqual({
            id: "launch",
            title: `Ra m${String.fromCharCode(0x1eaf)}t`,
            conceptCount: 3,
            provedCount: 0,
            state: "todo",
            locked: true,
        })
    })

    it("shows the CI run with a short commit and the probe run with its facts", () => {
        expect(subject.toCiRunView(ciRunRowOf())).toEqual({
            runId: "run-1",
            commit: "abc1234",
            passed: true,
            at: "2026-11-08T09:00:00.000Z",
        })
        expect(subject.toProbeRunView(probeRunRowOf())).toMatchObject({
            passed: true,
            results: [
                {
                    probeId: "health",
                    conceptId: null,
                    passed: true,
                    reason: "ok",
                    facts: [{ key: "status", value: "200" }],
                },
            ],
        })
        expect(
            subject.toProbeRunView(
                probeRunRowOf({ results: [{ probeId: "burst", conceptId: "rate-limiting", passed: false }] }),
            ).results[0],
        ).toMatchObject({ conceptId: "rate-limiting", reason: "", facts: [] })
    })
})

describe("toConceptView", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("shows pending slots, the pointer and the lesson of a concept with no result", () => {
        const view = subject.toConceptView(standingOf([]), conceptRowOf(), LESSON, "en")

        expect(view).toMatchObject({
            id: "idempotency",
            label: "Idempotency: a repeat changes nothing",
            state: "todo",
            comingSoon: false,
            lesson: { id: "idempotency", topicId: "reliability", title: "Idempotency" },
            location: "internal/booking/repo.go#Reserve",
            endpoint: "POST /bookings",
            failing: null,
            aiQuestion: null,
        })
        expect(view.slots.map((slot) => [slot.slot, slot.required, slot.state])).toEqual([
            ["test", true, "pending"],
            ["e2e", true, "pending"],
            ["probe", true, "pending"],
        ])
    })

    it("shows no pointer and no lesson while the lesson is being written", () => {
        expect(subject.toConceptView(standingOf([], true), undefined, undefined, "vi")).toMatchObject({
            comingSoon: true,
            lesson: null,
            location: null,
            endpoint: null,
            sampleBody: null,
        })
    })
})

describe("toConceptView (part 2)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("shows a failing probe with its reason, facts and the fixed question", () => {
        const rows = subject.toEvidenceRows([
            evidenceDbRowOf(),
            evidenceDbRowOf({
                slot: "probe",
                source: "server-probe",
                passed: false,
                ref: "repeat-same-key",
                run_id: "p1",
                detail: { reason: "second-differs", facts: { first: 201, second: 409 } },
                at: new Date("2026-11-08T09:30:00.000Z"),
            }),
        ])

        const view = subject.toConceptView(standingOf(rows), undefined, LESSON, "en")

        expect(view.state).toBe("practising")
        expect(view.failing).toMatchObject({
            slot: "probe",
            probeId: "repeat-same-key",
            reason: "second-differs",
            facts: [
                { key: "first", value: "201" },
                { key: "second", value: "409" },
            ],
        })
        expect(view.failing?.question).toMatch(/second call/u)
        expect(view.slots.find((slot) => slot.slot === "probe")).toMatchObject({
            state: "fail",
            proof: false,
            source: "server-probe",
        })
    })

    it("shows a failing test with its name, and the default reason of a failure without detail", () => {
        const rows = subject.toEvidenceRows([evidenceDbRowOf({ passed: false, ref: "[idempotency] twice" })])

        const view = subject.toConceptView(standingOf(rows), undefined, LESSON, "vi")

        expect(view.failing).toEqual({
            slot: "test",
            probeId: null,
            reason: "test-failed",
            facts: [{ key: "ref", value: "[idempotency] twice" }],
            question: "",
        })
    })
})

describe("toConceptView (part 3)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("shows the newest of practice and proof on a slot, and the question of the last AI read", () => {
        const definition = conceptOf("saga")
        if (definition === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        const read = evidenceDbRowOf({
            concept_id: "saga",
            slot: "code-read",
            source: "ai",
            passed: false,
            detail: { question: "Where does it compensate?" },
        })
        const sagaRows = subject.toEvidenceRows([
            read,
            evidenceDbRowOf({
                concept_id: "saga",
                slot: "code-read",
                source: "relay",
                run_id: "r",
                at: new Date("2026-11-08T08:00:00.000Z"),
            }),
        ])

        const view = subject.toConceptView(conceptStandingOf(definition, sagaRows, false), undefined, LESSON, "en")

        expect(view.slots[0]).toMatchObject({ state: "fail", source: "ai", at: "2026-11-08T09:00:00.000Z" })
        expect(view.failing).toMatchObject({ reason: "code-read-below-bar", question: "Where does it compensate?" })
        expect(view.aiQuestion).toBe("Where does it compensate?")

        const newerPractice = subject.toEvidenceRows([
            evidenceDbRowOf({ at: new Date("2026-11-08T07:00:00.000Z") }),
            evidenceDbRowOf({ source: "relay", run_id: "r1", at: new Date("2026-11-08T09:30:00.000Z") }),
        ])
        expect(subject.toConceptView(standingOf(newerPractice), undefined, LESSON, "en").slots[0]).toMatchObject({
            source: "relay",
            proof: true,
        })
    })

    it("picks the newest of several failing slots", () => {
        const rows = subject.toEvidenceRows([
            evidenceDbRowOf({ passed: false, ref: "older", at: new Date("2026-11-08T08:00:00.000Z") }),
            evidenceDbRowOf({
                slot: "e2e",
                passed: false,
                ref: "newer",
                run_id: "r2",
                at: new Date("2026-11-08T09:00:00.000Z"),
            }),
        ])

        expect(subject.toConceptView(standingOf(rows), undefined, LESSON, "en").failing).toMatchObject({
            slot: "e2e",
            reason: "e2e-failed",
        })
    })
})
