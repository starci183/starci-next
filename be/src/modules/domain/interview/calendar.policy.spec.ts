import { Test } from "@nestjs/testing"
import { freeMonthOf, nextResetOf, utcDayStartOf } from "./calendar.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { freeMonthOf, nextResetOf, utcDayStartOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.calendar.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("calendar policy", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("counts the free month in Vietnam time, so the last evening of a UTC month already belongs to the next one", () => {
        expect(subject.freeMonthOf(new Date("2026-11-08T10:00:00.000Z"))).toBe("2026-11")
        expect(subject.freeMonthOf(new Date("2026-11-30T17:30:00.000Z"))).toBe("2026-12")
        expect(subject.freeMonthOf(new Date("2026-12-31T16:59:00.000Z"))).toBe("2026-12")
        expect(subject.freeMonthOf(new Date("2026-12-31T17:00:00.000Z"))).toBe("2027-01")
    })

    it("resets the quota at the first instant of the next month in Vietnam", () => {
        expect(subject.nextResetOf(new Date("2026-11-08T10:00:00.000Z")).toISOString()).toBe("2026-11-30T17:00:00.000Z")
        expect(subject.nextResetOf(new Date("2026-12-31T17:00:00.000Z")).toISOString()).toBe("2027-01-31T17:00:00.000Z")
    })

    it("starts the fair-use window at midnight UTC", () => {
        expect(subject.utcDayStartOf(new Date("2026-11-08T23:59:59.000Z")).toISOString()).toBe(
            "2026-11-08T00:00:00.000Z",
        )
    })
})
