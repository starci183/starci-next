import { Test } from "@nestjs/testing"
import {
    choiceActivityOf,
    demoRootOf,
    demoSectionsOf,
    explainActivityOf,
    simulationActivityOf,
    simulationOf,
} from "@tests/fixtures/builders/lesson.builder"
import type { LessonActivity, LessonLocale, LessonSimulation } from "./lesson.contracts"
import type { LessonParsedLocale, LessonParsedSource } from "./lesson-import.contracts"
import { validateLesson } from "./lesson-validation.policy"

const VALIDATION_POLICY: unique symbol = Symbol("lesson.validation-policy")

const build = async (): Promise<typeof validateLesson> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: VALIDATION_POLICY, useFactory: () => validateLesson }],
    }).compile()
    return moduleRef.get<typeof validateLesson>(VALIDATION_POLICY)
}

const localeOf = (locale: LessonLocale): LessonParsedLocale => ({
    root: demoRootOf(locale),
    sections: demoSectionsOf(locale),
})

const parsedOf = (vi: Partial<LessonParsedLocale> = {}, en: Partial<LessonParsedLocale> = {}): LessonParsedSource => ({
    vi: { ...localeOf("vi"), ...vi },
    en: { ...localeOf("en"), ...en },
})

/** The vi locale with the activity of one section replaced. */
const withActivity = (sectionId: string, activity: LessonActivity): Partial<LessonParsedLocale> => ({
    sections: demoSectionsOf("vi").map((section) =>
        section.id === sectionId ? { ...section, activities: [activity] } : section,
    ),
})

const simulationWith = (change: (simulation: LessonSimulation) => Partial<LessonSimulation>): LessonActivity => ({
    ...simulationActivityOf("vi"),
    simulation: { ...simulationOf("vi"), ...change(simulationOf("vi")) },
})

describe("validateLesson", () => {
    it("refuses locales that disagree on the teacher's isPremium mark", async () => {
        const validate = await build()
        const issues = validate(parsedOf({}, { root: { ...demoRootOf("en"), isPremium: false } }))

        expect(issues.map((issue) => issue.message)).toEqual([
            'differs from vi.md: lacks "premium-mark default"',
            'differs from en.md: lacks "premium-mark false"',
        ])
    })

    it("accepts a lesson whose ids resolve, whose activities can be graded and whose locales agree", async () => {
        const validate = await build()

        expect(validate(parsedOf())).toEqual([])
    })

    it("accepts a lesson that schedules no review activity", async () => {
        const validate = await build()
        const { activities: _vi, ...viRoot } = demoRootOf("vi")
        const { activities: _en, ...enRoot } = demoRootOf("en")

        expect(validate(parsedOf({ root: viRoot }, { root: enRoot }))).toEqual([])
    })

    it("names an outcome id that does not resolve, with the file and the activity it is in", async () => {
        const validate = await build()
        const bad = { ...explainActivityOf("vi"), outcomeIds: ["demo--o1", "demo--gone"] }
        const issues = validate(parsedOf(withActivity("0-interview", bad), withActivity("0-interview", bad)))

        expect(issues).toContainEqual({
            path: "sections/0-interview/vi.md",
            field: "activities[0].outcomeIds",
            message: "demo--gone is not a learning outcome",
        })
    })

    it("names a lesson that holds no outcome", async () => {
        const validate = await build()
        const issues = validate(parsedOf({ root: { ...demoRootOf("vi"), learningOutcomes: [] } }))

        expect(issues).toContainEqual({ path: "vi.md", field: "learningOutcomes", message: "holds no outcome" })
    })

    it("names a locale without a section in the free challenge phase", async () => {
        const validate = await build()
        const sections = demoSectionsOf("en").map((section) => ({ ...section, phase: "predict" as const }))
        const issues = validate(parsedOf({}, { sections }))

        expect(issues).toContainEqual({
            path: "sections",
            field: "",
            message: "en has no section in the challenge phase",
        })
    })
})

describe("validateLesson activities", () => {
    it("names an activity id that appears twice in a locale", async () => {
        const validate = await build()
        const clash = { ...choiceActivityOf("vi"), id: "demo--interview" }
        const issues = validate(parsedOf(withActivity("1-prediction", clash)))

        expect(issues).toContainEqual({
            path: "sections/1-prediction/vi.md",
            field: "activities[0]",
            message: "activity id demo--interview appears twice",
        })
    })

    it("names an activity that has no rubric, no single correct option and no simulation", async () => {
        const validate = await build()
        const bare = { ...explainActivityOf("vi"), rubric: [] }
        const twoRight = {
            ...choiceActivityOf("vi"),
            options: [
                { id: "a", label: "a", explanation: "a", isCorrect: true },
                { id: "b", label: "b", explanation: "b", isCorrect: true },
            ],
        }
        const oneOption = {
            ...choiceActivityOf("vi"),
            options: [{ id: "a", label: "a", explanation: "a", isCorrect: true }],
        }

        const messages = [bare, twoRight, oneOption].map(
            (activity) =>
                validate(parsedOf(withActivity("0-interview", activity))).find(
                    (issue) => issue.field === "activities[0]",
                )?.message,
        )

        expect(messages).toEqual([
            "demo--interview has no rubric, no single correct option and no simulation",
            "demo--predict has no rubric, no single correct option and no simulation",
            "demo--predict has no rubric, no single correct option and no simulation",
        ])
    })
})

describe("validateLesson simulations", () => {
    it("names a simulation whose initial state, states or actions do not resolve", async () => {
        const validate = await build()
        const initial = simulationWith(() => ({ initialStateId: "nowhere" }))
        const dangling = simulationWith((simulation) => ({
            transitions: [{ id: "t", fromStateId: "x", actionId: "y", toStateId: "z" }, ...simulation.transitions],
        }))

        expect(validate(parsedOf(withActivity("2-experiment", initial))).map((issue) => issue.field)).toContain(
            "activities[0].simulation.initialStateId",
        )
        expect(validate(parsedOf(withActivity("2-experiment", dangling))).map((issue) => issue.field)).toEqual(
            expect.arrayContaining([
                "activities[0].simulation.transitions[0].fromStateId",
                "activities[0].simulation.transitions[0].toStateId",
                "activities[0].simulation.transitions[0].actionId",
            ]),
        )
    })

    it("names a simulation that reaches no success state from its initial state", async () => {
        const validate = await build()
        const stuck = simulationWith((simulation) => ({ transitions: simulation.transitions.slice(0, 1) }))
        const issues = validate(parsedOf(withActivity("2-experiment", stuck)))

        expect(issues).toContainEqual({
            path: "sections/2-experiment/vi.md",
            field: "activities[0].simulation",
            message: "reaches no success state from its initial state",
        })
    })

    it("names every structural difference between the two locales, once on each side", async () => {
        const validate = await build()
        const flipped = choiceActivityOf("en", "demo--predict")
        const changed = {
            ...flipped,
            options: (flipped.options ?? []).map((option, index) => ({ ...option, isCorrect: index === 1 })),
        }
        const sections = demoSectionsOf("en").map((section) =>
            section.id === "1-prediction" ? { ...section, activities: [changed] } : section,
        )
        const issues = validate(parsedOf({}, { sections }))

        expect(issues.map((issue) => issue.path).sort()).toEqual(["en.md", "en.md", "vi.md", "vi.md"])
        expect(issues[0]?.message).toBe('differs from vi.md: lacks "option demo--predict/demo--predict--1 true"')
    })
})
