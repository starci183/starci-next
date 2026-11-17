import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { Test } from "@nestjs/testing"
import { evidenceOf, PROJECT_ID, PROJECT_LEARNER, PROJECT_NOW } from "@tests/fixtures/builders/project.builder"
import { fixtureCheckSet } from "@tests/fixtures/builders/check-set.builder"
import { milestoneIn } from "./project-check-set-lookup.policy"
import { TRACK_LABELS, type ExperienceSubject } from "./project-experience.policy"
import { deployedExperienceOf, itemTypeOfMilestone, milestoneExperienceOf } from "./project-experience.policy"

const POLICY: unique symbol = Symbol("project.project-experience-policy")
const policies = { deployedExperienceOf, itemTypeOfMilestone, milestoneExperienceOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const SUBJECT: ExperienceSubject = {
    learnerId: PROJECT_LEARNER,
    projectId: PROJECT_ID,
    name: "Clinic booking",
    stack: "Go, PostgreSQL",
    kind: "app",
    track: null,
    deployedUrl: "https://clinic.example.com",
}

const SET = fixtureCheckSet()
const milestoneOf = (id: string) => milestoneIn(SET, id)

const launch = () => {
    const milestone = milestoneOf("bf-safe-and-reliable")
    if (milestone === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
    return milestone
}

const provedLaunch = () =>
    launch().concepts.flatMap((id) => [
        evidenceOf({ conceptId: id, slot: "test", ref: `[${id}] ok` }),
        evidenceOf({ conceptId: id, slot: "probe", source: "server-probe", runId: "p1", ref: `${id}-probe` }),
    ])

describe("itemTypeOfMilestone", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("gives the coding-agent and agent-build milestones their own lines", () => {
        expect(subject.itemTypeOfMilestone("ai-coding-mindset", "app")).toBe("projects.ai-coding-mindset")
        expect(subject.itemTypeOfMilestone("agent-mindset", "agent")).toBe("projects.agent-built")
        expect(subject.itemTypeOfMilestone("agent-mindset", "app")).toBe("projects.milestone")
        expect(subject.itemTypeOfMilestone("bf-safe-and-reliable", "app")).toBe("projects.milestone")
    })
})

describe("milestoneExperienceOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("drafts the milestone line from the project and the proof, passing with a signed CI run among the proof", () => {
        const params = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: SUBJECT,
            milestone: launch(),
            rows: provedLaunch(),
            at: PROJECT_NOW,
        })

        expect(params).toMatchObject({
            learnerId: PROJECT_LEARNER,
            itemType: "projects.milestone",
            subject: `bf-safe-and-reliable@${PROJECT_ID}`,
            projectId: PROJECT_ID,
            grade: { result: "pass" },
        })
        expect(params.slotValues.en).toEqual({
            project: "Clinic booking",
            stack: "Go, PostgreSQL",
            concepts: launch()
                .concepts.map((id) => SET.concepts.find((concept) => concept.id === id)?.label.en)
                .join(", "),
            ci: "#run-1 (abc1234)",
        })
        expect(params.evidence.map((item) => item.proofForm).sort()).toEqual(["server-probe", "signed-ci"])
        expect(params.grade.criteria.every((criterion) => criterion.level === 2)).toBe(true)
    })

    it("fails the grade when a concept has no proof or no signed CI run is among the proof", () => {
        const missing = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: SUBJECT,
            milestone: launch(),
            rows: provedLaunch().slice(0, 2),
            at: PROJECT_NOW,
        })
        const noCi = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: SUBJECT,
            milestone: launch(),
            rows: provedLaunch().map((row) => ({ ...row, source: "server-probe" as const })),
            at: PROJECT_NOW,
        })

        expect(missing.grade.result).toBe("fail")
        expect(noCi.grade.result).toBe("fail")
        expect(noCi.slotValues.en["ci"]).toBe("-")
    })
})

describe("milestoneExperienceOf (part 2)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("writes the tool for the coding-agent and agent-build lines, Claude Code unless the project names a track", () => {
        const mindset = { id: "ai-coding-mindset", title: { vi: "x", en: "x" }, concepts: ["task-spec"] }
        const agent = milestoneOf("agent-mindset")
        if (agent === null) throw new ProjectError({ code: ProjectErrorCode.ConceptNotFound })
        const reads = (ids: ReadonlyArray<string>) =>
            ids.map((id) => evidenceOf({ conceptId: id, slot: "code-read", source: "ai", ref: `src/${id}.ts` }))

        const coding = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: SUBJECT,
            milestone: mindset,
            rows: reads(["task-spec"]),
            at: PROJECT_NOW,
        })
        const built = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: { ...SUBJECT, kind: "agent", track: "openclaw" },
            milestone: agent,
            rows: [],
            at: PROJECT_NOW,
        })

        expect(coding.itemType).toBe("projects.ai-coding-mindset")
        expect(coding.slotValues.vi).toEqual({ project: "Clinic booking", tool: TRACK_LABELS.claude })
        expect(coding.evidence).toEqual([
            { kind: "code-read", ref: "task-spec", proofForm: "graded-session", at: "2026-11-08T09:00:00.000Z" },
        ])
        expect(built.itemType).toBe("projects.agent-built")
        expect(built.slotValues.en["tool"]).toBe("OpenClaw")
    })

    it("falls back to the concept id for an unknown concept", () => {
        const params = subject.milestoneExperienceOf({
            concepts: SET.concepts,
            subject: SUBJECT,
            milestone: { id: "custom", title: { vi: "x", en: "x" }, concepts: ["unknown-concept"] },
            rows: [],
            at: PROJECT_NOW,
        })

        expect(params.grade.criteria[0]).toMatchObject({ criterion: "unknown-concept", level: 0 })
        expect(params.slotValues.en["concepts"]).toBe("unknown-concept")
    })

    it("writes a dash when the signed run has no commit", () => {
        const rows = provedLaunch().map((row) => ({ ...row, commitSha: null }))

        expect(
            subject.milestoneExperienceOf({
                concepts: SET.concepts,
                subject: SUBJECT,
                milestone: launch(),
                rows,
                at: PROJECT_NOW,
            }).slotValues.en["ci"],
        ).toBe("#run-1 ()")
    })
})

describe("deployedExperienceOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("drafts the deployment line from the address and the probe run", () => {
        const params = subject.deployedExperienceOf({
            subject: SUBJECT,
            runId: "probe-1",
            url: "https://clinic.example.com",
            at: PROJECT_NOW,
        })

        expect(params).toMatchObject({
            itemType: "projects.deployed",
            subject: `deployed@${PROJECT_ID}`,
            evidence: [{ kind: "probe-run", ref: "probe-1", proofForm: "server-probe", at: PROJECT_NOW.toISOString() }],
            slotValues: { vi: { project: "Clinic booking", url: "https://clinic.example.com" } },
            grade: { result: "pass" },
        })
    })
})
