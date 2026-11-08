import { Test } from "@nestjs/testing"
import {
    CAREER_LEARNER,
    CAREER_REVIEWER,
    CAREER_TEACHER,
    reviewerOf,
    teacherOf,
} from "@tests/fixtures/builders/career.builder"
import { CareerErrorCode } from "./errors/career.error"
import { maySign, requireSignerRole, requireTeacher, signerRoleOf } from "./review-access.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { maySign, requireSignerRole, requireTeacher, signerRoleOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.review-access")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const TARGET = { learnerId: CAREER_LEARNER, part: "essentials" as const, teacherOnly: false }
const SCOPE = { parts: ["essentials" as const], conflicts: [] }

describe("signerRoleOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("picks TEACHER first, then REVIEWER, else nothing", () => {
        expect(subject.signerRoleOf(teacherOf({ roles: ["REVIEWER", "TEACHER"] }))).toBe("TEACHER")
        expect(subject.signerRoleOf(reviewerOf())).toBe("REVIEWER")
        expect(subject.signerRoleOf({ subject: CAREER_LEARNER, roles: ["offline_access"] })).toBeNull()
    })
})

describe("requireSignerRole and requireTeacher", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("refuses a learner and lets a signer through", () => {
        const learner = { subject: CAREER_LEARNER, roles: [] }

        expect(subject.requireSignerRole(reviewerOf())).toBe("REVIEWER")
        expect(() => subject.requireSignerRole(learner)).toThrow(CareerErrorCode.ReviewForbidden)
        expect(() => subject.requireTeacher(teacherOf())).not.toThrow()
        expect(() => subject.requireTeacher(reviewerOf())).toThrow(CareerErrorCode.ReviewForbidden)
    })
})

describe("maySign", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("never lets a signer sign their own item", () => {
        expect(subject.maySign(teacherOf({ subject: CAREER_LEARNER }), "TEACHER", null, TARGET)).toBe(false)
    })

    it("lets the teacher sign every other item, held items included", () => {
        expect(subject.maySign(teacherOf(), "TEACHER", null, { ...TARGET, teacherOnly: true })).toBe(true)
        expect(CAREER_TEACHER).not.toBe(CAREER_LEARNER)
    })

    it("lets a reviewer sign only inside the scope, outside the conflicts and not a held item", () => {
        const reviewer = reviewerOf()

        expect(subject.maySign(reviewer, "REVIEWER", SCOPE, TARGET)).toBe(true)
        expect(subject.maySign(reviewer, "REVIEWER", null, TARGET)).toBe(false)
        expect(subject.maySign(reviewer, "REVIEWER", SCOPE, { ...TARGET, teacherOnly: true })).toBe(false)
        expect(subject.maySign(reviewer, "REVIEWER", SCOPE, { ...TARGET, part: "projects" })).toBe(false)
        expect(subject.maySign(reviewer, "REVIEWER", { ...SCOPE, conflicts: [CAREER_LEARNER] }, TARGET)).toBe(false)
        expect(CAREER_REVIEWER).toBe(reviewer.subject)
    })
})
