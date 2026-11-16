import { Test } from "@nestjs/testing"
import { ACTIVITY_MAX, buildActivity, buildProgress, buildProjects, buildReview } from "./progress-view.policy"
import type { ProgressSources } from "./progress.contracts"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildActivity, buildProgress, buildProjects, buildReview }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("progress.view-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const sourcesOf = (overrides: Partial<ProgressSources> = {}): ProgressSources => ({
    plan: "premium",
    openParts: ["essence", "source", "script", "apply"],
    streak: { current: 4, longest: 9, todayCounted: true },
    review: { due: 6, overdue: 2, doneToday: 3, goalDaily: 10 },
    lessons: [
        {
            id: "l1",
            title: "Idempotency",
            topicId: "api",
            topicTitle: "API",
            completedAt: "2026-11-12T08:00:00.000Z",
            started: true,
            opener: { answered: 5, firstCorrect: 2, latestCorrect: 5 },
        },
    ],
    harness: {
        builds: [{ id: "b1", title: "Agent", stages: [{ id: "s1", title: "Loop", state: "proved" }] }],
        doctor: [],
        trials: [],
        events: [{ id: "b1:s1", title: "Loop", at: "2026-11-13T08:00:00.000Z" }],
    },
    projects: [
        {
            id: "p1",
            name: "Shop",
            provedConcepts: 3,
            practisingConcepts: 2,
            totalConcepts: 8,
            doneMilestones: 1,
            totalMilestones: 4,
        },
        {
            id: "p2",
            name: "Agent",
            provedConcepts: 1,
            practisingConcepts: 0,
            totalConcepts: 5,
            doneMilestones: 0,
            totalMilestones: 3,
        },
    ],
    proved: [{ projectId: "p1", conceptId: "idempotency", provedAt: "2026-11-14T08:00:00.000Z" }],
    verified: [{ itemId: "i1", title: "Built a CQRS read model", signedAt: "2026-11-11T08:00:00.000Z" }],
    unavailable: [],
    ...overrides,
})

describe("buildProgress", () => {
    it("fills the ribbon from the proved concepts, the streak, the lessons done and the builds done", async () => {
        const { buildProgress: build } = await loadSubject()

        const view = build(sourcesOf())

        expect(view.ribbon).toEqual({ provedConcepts: 1, streak: 4, lessonsDone: 1, buildsDone: 1 })
        expect(view.plan).toBe("premium")
        expect(view.projectsLocked).toBe(false)
        expect(view.projects).toMatchObject({
            conceptsProved: 4,
            conceptsPractising: 2,
            conceptsTotal: 13,
            milestonesDone: 1,
            milestonesTotal: 7,
        })
    })

    it("shows no projects and says they are locked for a learner without a subscription", async () => {
        const { buildProgress: build } = await loadSubject()

        const view = build(sourcesOf({ plan: "free", openParts: ["essence"], proved: [] }))

        expect(view.projects).toBeNull()
        expect(view.projectsLocked).toBe(true)
        expect(view.essentials?.parts[1]?.access).toBe("locked")
        expect(view.harness).not.toBeNull()
    })

    it("leaves the section of a source that failed null and lists it, while the rest still answers", async () => {
        const { buildProgress: build } = await loadSubject()

        const view = build(
            sourcesOf({
                lessons: null,
                harness: null,
                review: null,
                streak: null,
                unavailable: ["essentials", "harness"],
            }),
        )

        expect(view.essentials).toBeNull()
        expect(view.harness).toBeNull()
        expect(view.review).toBeNull()
        expect(view.unavailable).toEqual(["essentials", "harness"])
        expect(view.ribbon).toEqual({ provedConcepts: 1, streak: 0, lessonsDone: 0, buildsDone: 0 })
    })
})

describe("buildReview", () => {
    it("joins the review day with the streak and survives either one missing", async () => {
        const { buildReview: review } = await loadSubject()
        const day = { due: 6, overdue: 2, doneToday: 3, goalDaily: 10 }

        expect(review(day, { current: 4, longest: 9, todayCounted: true })).toEqual({
            ...day,
            streak: 4,
            longestStreak: 9,
            todayCounted: true,
        })
        expect(review(null, { current: 1, longest: 1, todayCounted: false })).toMatchObject({ due: 0, streak: 1 })
        expect(review(day, null)).toMatchObject({ due: 6, streak: 0 })
        expect(review(null, null)).toBeNull()
    })
})

describe("buildProjects", () => {
    it("sums the concepts and milestones over the projects and keeps each project", async () => {
        const { buildProjects: build } = await loadSubject()

        const view = build(sourcesOf().projects ?? [])

        expect(view.projects.map((project) => project.projectId)).toEqual(["p1", "p2"])
        expect(view.projects[0]).toMatchObject({ proved: 3, practising: 2, total: 8 })
    })
})

describe("buildActivity", () => {
    it("merges lessons, concepts, signed items and harness stages, newest first", async () => {
        const { buildActivity: activity } = await loadSubject()

        const lines = activity(sourcesOf())

        expect(lines.map((line) => line.kind)).toEqual([
            "concept-proved",
            "harness-stage",
            "lesson-done",
            "experience-verified",
        ])
        expect(lines[0]).toMatchObject({ id: "concept:p1:idempotency", at: "2026-11-14T08:00:00.000Z" })
    })

    it("holds at most the newest lines", async () => {
        const { buildActivity: activity } = await loadSubject()
        const proved = Array.from({ length: ACTIVITY_MAX + 5 }, (_value, index) => ({
            projectId: "p1",
            conceptId: `c${String(index).padStart(2, "0")}`,
            provedAt: `2026-11-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        }))

        const lines = activity(sourcesOf({ lessons: null, harness: null, verified: [], proved }))

        expect(lines).toHaveLength(ACTIVITY_MAX)
        expect(lines[0]?.id).toBe(`concept:p1:c${String(ACTIVITY_MAX + 4).padStart(2, "0")}`)
    })
})
