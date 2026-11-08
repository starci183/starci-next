import { Test } from "@nestjs/testing"
import { behavioralMaterial, gradedTechnicalOf, technicalMaterial } from "@tests/fixtures/builders/interview.builder"
import { STAR_KEYS, type GradedQuestion } from "./interview.contracts"
import { DEFAULT_SCORING_RULES, scorecardOf, verdictOf, type ScoringQuestion } from "./scoring.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { scorecardOf, verdictOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.scoring.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const technical = (over: Partial<ScoringQuestion> = {}): ScoringQuestion => ({
    position: 0,
    questionId: "t/0",
    family: "technical",
    material: technicalMaterial,
    idealAnswer: "ideal",
    moduleRefs: ["0-core"],
    skipped: false,
    hintsUsed: 0,
    graded: gradedTechnicalOf(),
    ...over,
})

const dimension = (
    key: ScoringQuestion["material"]["star"][number]["key"],
    level: number,
    evidenceQuote = "quote",
) => ({ key, level, evidenceQuote })

const BEHAVIORAL_GRADED: GradedQuestion = {
    position: 1,
    checklist: [],
    dimensions: [
        dimension("situationClarity", 4),
        dimension("actionSpecificity", 3),
        dimension("resultImpact", 2),
        dimension("selfAwareness", 1),
        dimension("communication", 9),
        dimension("relevanceToRole", 0, "dropped"),
    ],
    ownershipWeak: false,
    note: "ok",
}

const behavioral = (over: Partial<ScoringQuestion> = {}): ScoringQuestion => ({
    position: 1,
    questionId: "eq/0",
    family: "behavioral",
    material: behavioralMaterial,
    idealAnswer: "",
    moduleRefs: [],
    skipped: false,
    hintsUsed: 0,
    graded: BEHAVIORAL_GRADED,
    ...over,
})

describe("verdictOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it.each([
        [80, 0, "pass"],
        [70, 1, "borderline"],
        [90, 2, "fail"],
        [69, 0, "borderline"],
        [50, 3, "borderline"],
        [49, 0, "fail"],
    ])("scores %i with %i critical misses as %s", (score, missed, verdict) => {
        expect(subject.verdictOf(score, missed, DEFAULT_SCORING_RULES)).toBe(verdict)
    })
})

describe("scorecardOf technical", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("scores the checklist points that were hit, names the critical misses and keeps the evidence quote", () => {
        const card = subject.scorecardOf(
            [
                technical({
                    graded: gradedTechnicalOf({ checklist: [{ item: 1, hit: true, evidenceQuote: "trade-off" }] }),
                }),
            ],
            DEFAULT_SCORING_RULES,
        )

        expect(card.questions[0]).toMatchObject({
            score: 40,
            criticalMissed: ["Names the layer"],
            idealAnswer: "ideal",
            note: "Missed the trade-off.",
        })
        expect(card.questions[0]?.checklist.map((item) => [item.hit, item.evidenceQuote])).toEqual([
            [false, ""],
            [true, "trade-off"],
        ])
        expect(card).toMatchObject({
            technicalScore: 40,
            technicalVerdict: "fail",
            behavioralScore: null,
            behavioralVerdict: null,
        })
    })

    it("takes the hint penalty off the score but never below zero, and gives the full score for a full answer", () => {
        const all = gradedTechnicalOf({
            checklist: [
                { item: 0, hit: true, evidenceQuote: "a" },
                { item: 1, hit: true, evidenceQuote: "b" },
            ],
        })
        const hinted = subject.scorecardOf([technical({ graded: all, hintsUsed: 2 })], DEFAULT_SCORING_RULES)
        const floor = subject.scorecardOf(
            [technical({ graded: gradedTechnicalOf({ checklist: [] }), hintsUsed: 3 })],
            DEFAULT_SCORING_RULES,
        )

        expect(hinted.questions[0]).toMatchObject({ score: 90, hintPenalty: 10, hintsUsed: 2 })
        expect(floor.questions[0]).toMatchObject({ score: 0, hintPenalty: 0 })
        expect(hinted.verdict).toBe("pass")
    })

    it("scores a skipped question zero, as a miss of every critical item", () => {
        const card = subject.scorecardOf([technical({ skipped: true, graded: null })], DEFAULT_SCORING_RULES)

        expect(card.questions[0]).toMatchObject({
            skipped: true,
            score: 0,
            criticalMissed: ["Names the layer"],
            note: "",
        })
    })
})

describe("scorecardOf technical (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("computes the attribute scores, the strengths and the gaps with the module they come from", () => {
        const card = subject.scorecardOf([technical()], DEFAULT_SCORING_RULES)

        expect(card.attributes).toEqual([
            { key: "problemSolving", score: 0 },
            { key: "technical", score: 100 },
        ])
        expect(card.strengths).toEqual(["Names the layer"])
        expect(card.gaps).toEqual([{ text: "Explains the trade-off", position: 0, moduleRefs: ["0-core"] }])
    })

    it("puts the missed critical items before the other misses in the gaps", () => {
        const card = subject.scorecardOf(
            [technical({ graded: gradedTechnicalOf({ checklist: [{ item: 1, hit: true, evidenceQuote: "x" }] }) })],
            DEFAULT_SCORING_RULES,
        )

        expect(card.gaps.map((gap) => gap.text)).toEqual(["Names the layer"])
    })
})

describe("scorecardOf behavioral", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("is the mean of the six STAR levels, clamps a level, drops the quote of level 0 and fills a missing dimension with 0", () => {
        const card = subject.scorecardOf([behavioral()], DEFAULT_SCORING_RULES)

        expect(card.questions[0]?.dimensions.map((entry) => entry.level)).toEqual([4, 3, 2, 1, 4, 0])
        expect(card.questions[0]?.dimensions[5]?.evidenceQuote).toBe("")
        expect(card.questions[0]?.score).toBe(58)
        expect(card.behavioralScore).toBe(58)
        expect(card.attributes.find((entry) => entry.key === "communication")?.score).toBe(100)
        expect(card.strengths).toEqual(["Sets the scene.", "Own actions.", "Clear story."])
        expect(card.gaps.map((gap) => gap.text)).toEqual(["Shows maturity.", "Fits the role."])
        const missing = subject.scorecardOf(
            [behavioral({ graded: { position: 1, checklist: [], dimensions: [], ownershipWeak: false, note: "" } })],
            DEFAULT_SCORING_RULES,
        )
        expect(missing.questions[0]?.score).toBe(0)
    })

    it("takes the ownership deduction off when the grader flags it, never below zero, and nothing for a skip", () => {
        const weak = subject.scorecardOf(
            [
                behavioral({
                    graded: { ...BEHAVIORAL_GRADED, ownershipWeak: true },
                }),
            ],
            DEFAULT_SCORING_RULES,
        )
        const none = subject.scorecardOf(
            [behavioral({ graded: { position: 1, checklist: [], dimensions: [], ownershipWeak: true, note: "" } })],
            DEFAULT_SCORING_RULES,
        )
        const skipped = subject.scorecardOf([behavioral({ skipped: true, graded: null })], DEFAULT_SCORING_RULES)

        expect(weak.questions[0]).toMatchObject({ score: 43, ownershipWeak: true })
        expect(none.questions[0]?.score).toBe(0)
        expect(skipped.questions[0]).toMatchObject({ score: 0, ownershipWeak: false })
    })
})

describe("scorecardOf a whole session", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("keeps the pillars apart, averages every question for the overall score and applies the verdict lines", () => {
        const full = gradedTechnicalOf({
            checklist: [
                { item: 0, hit: true, evidenceQuote: "a" },
                { item: 1, hit: true, evidenceQuote: "b" },
            ],
        })
        const strong = behavioral({
            graded: {
                position: 1,
                checklist: [],
                dimensions: STAR_KEYS.map((key) => dimension(key, 4)),
                ownershipWeak: false,
                note: "",
            },
        })

        const card = subject.scorecardOf([technical({ graded: full }), strong], DEFAULT_SCORING_RULES)

        expect(card).toMatchObject({
            overallScore: 100,
            verdict: "pass",
            technicalScore: 100,
            technicalVerdict: "pass",
            behavioralScore: 100,
            behavioralVerdict: "pass",
        })
    })

    it("fails the session with a pass-level score when two critical items were missed", () => {
        const one = technical({
            graded: gradedTechnicalOf({ checklist: [{ item: 1, hit: true, evidenceQuote: "b" }] }),
        })
        const two = technical({
            position: 1,
            questionId: "t/1",
            graded: gradedTechnicalOf({ position: 1, checklist: [{ item: 1, hit: true, evidenceQuote: "b" }] }),
        })

        const card = subject.scorecardOf([one, two], { ...DEFAULT_SCORING_RULES, passScore: 40 })

        expect(card.overallScore).toBe(40)
        expect(card.verdict).toBe("fail")
    })

    it("scores an empty session as zero with no pillar", () => {
        expect(subject.scorecardOf([], DEFAULT_SCORING_RULES)).toMatchObject({
            overallScore: 0,
            technicalScore: null,
            verdict: "fail",
            gaps: [],
            strengths: [],
        })
    })
})
