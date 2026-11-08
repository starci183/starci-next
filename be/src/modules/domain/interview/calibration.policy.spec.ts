import { Test } from "@nestjs/testing"
import { authoredScoreOf, bankCalibrationOf, questionCalibrationOf, type SampleGrade } from "./calibration.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { authoredScoreOf, bankCalibrationOf, questionCalibrationOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.calibration.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const grade = (level: number, authored: number | null, graded: number): SampleGrade => ({ level, authored, graded })

describe("authoredScoreOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("is the mean of the reference scores that exist, and nothing when they disagree widely or none exists", () => {
        expect(subject.authoredScoreOf({ level: 1, answer: "a", sonnet: 100, haiku: 80 })).toBe(90)
        expect(subject.authoredScoreOf({ level: 1, answer: "a", sonnet: null, haiku: 40 })).toBe(40)
        expect(subject.authoredScoreOf({ level: 1, answer: "a", sonnet: 40, haiku: null })).toBe(40)
        expect(subject.authoredScoreOf({ level: 1, answer: "a", sonnet: null, haiku: null })).toBeNull()
        expect(subject.authoredScoreOf({ level: 1, answer: "a", sonnet: 0, haiku: 100 })).toBeNull()
    })
})

describe("questionCalibrationOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("agrees when the order holds and the scores land near the authored ones", () => {
        const grades = [grade(3, 30, 35), grade(1, 95, 90), grade(2, 65, 60), grade(4, null, 40), grade(5, 0, 0)]

        expect(subject.questionCalibrationOf("q", grades)).toEqual({ questionId: "q", ok: true, reason: "" })
    })

    it("disagrees when a weaker answer outscores a stronger one beyond the slack", () => {
        expect(subject.questionCalibrationOf("q", [grade(1, null, 50), grade(2, null, 80)])).toMatchObject({
            ok: false,
            reason: "level 2 scored above a stronger answer",
        })
        expect(subject.questionCalibrationOf("q", [grade(1, null, 50), grade(2, null, 54)]).ok).toBe(true)
    })

    it("disagrees when a score lands too far from the authored one", () => {
        expect(subject.questionCalibrationOf("q", [grade(1, 100, 60)])).toMatchObject({
            ok: false,
            reason: "level 1 landed 60 against 100",
        })
    })
})

describe("bankCalibrationOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("passes a bank when enough questions agree and fails an empty one", () => {
        const ok = (id: string) => ({ questionId: id, ok: true, reason: "" })
        const no = (id: string) => ({ questionId: id, ok: false, reason: "x" })

        expect(subject.bankCalibrationOf([ok("a"), ok("b"), ok("c"), ok("d"), no("e")])).toMatchObject({
            passed: true,
            agreement: 0.8,
        })
        expect(subject.bankCalibrationOf([ok("a"), no("b")])).toMatchObject({ passed: false, agreement: 0.5 })
        expect(subject.bankCalibrationOf([])).toMatchObject({ passed: false, agreement: 0 })
    })
})
