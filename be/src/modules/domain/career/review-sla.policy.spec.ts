import { Test } from "@nestjs/testing"
import {
    DEFAULT_CAREER_SETTINGS,
    addCalendarDays,
    addWorkingDays,
    careerSettingsOf,
    dueAtOf,
    slaOf,
} from "./review-sla.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { addCalendarDays, addWorkingDays, careerSettingsOf, dueAtOf, slaOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.review-sla")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

/** Friday 2026-11-13, 16:00 in Asia/Ho_Chi_Minh. */
const FRIDAY = new Date("2026-11-13T09:00:00.000Z")

describe("careerSettingsOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("falls back to the proposed defaults of Q-CA-3..8", () => {
        expect(subject.careerSettingsOf({})).toEqual(DEFAULT_CAREER_SETTINGS)
        expect(DEFAULT_CAREER_SETTINGS).toEqual({
            reviewWorkingDays: 3,
            reminderWorkingDays: 2,
            returnsBeforeTeacher: 3,
            teacherHoldDays: 7,
            reviewerCapacity: 30,
            hiringMinVerified: 3,
        })
    })

    it("takes each setting the app registered", () => {
        const options = {
            reviewWorkingDays: 5,
            reminderWorkingDays: 4,
            returnsBeforeTeacher: 2,
            teacherHoldDays: 10,
            reviewerCapacity: 12,
            hiringMinVerified: 4,
        }

        expect(subject.careerSettingsOf(options)).toEqual(options)
    })
})

describe("addWorkingDays", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("skips the weekend in Asia/Ho_Chi_Minh and keeps the local time", () => {
        expect(subject.addWorkingDays(FRIDAY, 1).toISOString()).toBe("2026-11-16T09:00:00.000Z")
        expect(subject.addWorkingDays(FRIDAY, 3).toISOString()).toBe("2026-11-18T09:00:00.000Z")
    })

    it("counts the Vietnamese date, not the UTC one, near midnight", () => {
        const saturdayEarly = new Date("2026-11-13T18:00:00.000Z")

        expect(subject.addWorkingDays(saturdayEarly, 1).toISOString()).toBe("2026-11-15T18:00:00.000Z")
    })

    it("answers the same instant for zero days", () => {
        expect(subject.addWorkingDays(FRIDAY, 0)).toEqual(FRIDAY)
    })
})

describe("dueAtOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("gives a working-day deadline, or the teacher's calendar hold", () => {
        expect(subject.dueAtOf(FRIDAY, false, DEFAULT_CAREER_SETTINGS).toISOString()).toBe("2026-11-18T09:00:00.000Z")
        expect(subject.dueAtOf(FRIDAY, true, DEFAULT_CAREER_SETTINGS)).toEqual(subject.addCalendarDays(FRIDAY, 7))
        expect(subject.addCalendarDays(FRIDAY, 7).toISOString()).toBe("2026-11-20T09:00:00.000Z")
    })
})

describe("slaOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    const due = new Date("2026-11-18T09:00:00.000Z")

    it("is on time before the reminder, due soon after it and overdue at the deadline", () => {
        expect(subject.slaOf(FRIDAY, due, new Date("2026-11-16T09:00:00.000Z"), DEFAULT_CAREER_SETTINGS)).toBe(
            "on-time",
        )
        expect(subject.slaOf(FRIDAY, due, new Date("2026-11-17T09:00:00.000Z"), DEFAULT_CAREER_SETTINGS)).toBe(
            "due-soon",
        )
        expect(subject.slaOf(FRIDAY, due, due, DEFAULT_CAREER_SETTINGS)).toBe("overdue")
    })
})
