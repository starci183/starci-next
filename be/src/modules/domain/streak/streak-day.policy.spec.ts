import { Test } from "@nestjs/testing"
import { addDays, dayOf, daysBetween, earlierDay, laterDay, weekStartOf } from "./streak-day.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { dayOf, addDays, weekStartOf, daysBetween, earlierDay, laterDay }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("streak.day-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("dayOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads the calendar day in Ho Chi Minh City, which is seven hours ahead of UTC", () => {
        expect(subject.dayOf(new Date("2026-11-08T16:59:59.000Z"))).toBe("2026-11-08")
        expect(subject.dayOf(new Date("2026-11-08T17:00:00.000Z"))).toBe("2026-11-09")
    })
})

describe("addDays", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("moves across month and year ends, forward and back", () => {
        expect(subject.addDays("2026-12-31", 1)).toBe("2027-01-01")
        expect(subject.addDays("2026-03-01", -1)).toBe("2026-02-28")
    })
})

describe("weekStartOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("answers the Monday of the week for every weekday, Sunday last", () => {
        expect(subject.weekStartOf("2026-11-02")).toBe("2026-11-02")
        expect(subject.weekStartOf("2026-11-05")).toBe("2026-11-02")
        expect(subject.weekStartOf("2026-11-08")).toBe("2026-11-02")
        expect(subject.weekStartOf("2026-11-09")).toBe("2026-11-09")
    })
})

describe("daysBetween", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("lists both ends, and nothing when the end is before the start", () => {
        expect(subject.daysBetween("2026-11-07", "2026-11-09")).toEqual(["2026-11-07", "2026-11-08", "2026-11-09"])
        expect(subject.daysBetween("2026-11-09", "2026-11-08")).toEqual([])
    })
})

describe("earlierDay and laterDay", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("pick the earlier and the later of two days, either order", () => {
        expect(subject.earlierDay("2026-11-09", "2026-11-07")).toBe("2026-11-07")
        expect(subject.earlierDay("2026-11-07", "2026-11-09")).toBe("2026-11-07")
        expect(subject.laterDay("2026-11-09", "2026-11-07")).toBe("2026-11-09")
        expect(subject.laterDay("2026-11-07", "2026-11-09")).toBe("2026-11-09")
    })
})
