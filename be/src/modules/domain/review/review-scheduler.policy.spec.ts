import { Test } from "@nestjs/testing"
import { NEW_STEP, REVIEW_LADDER, ladderScheduler } from "./review-scheduler.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { ladderScheduler }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("review.scheduler-policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("ladderScheduler schedule", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("sends again back to step 0 and returns the item at the end of today's session", () => {
        expect(subject.ladderScheduler.schedule({ step: 5 }, "again")).toEqual({
            step: 0,
            status: "learning",
            intervalDays: 0,
        })
    })

    it("keeps hard on its step, and starts a new item at the first interval", () => {
        expect(subject.ladderScheduler.schedule({ step: 3 }, "hard")).toEqual({
            step: 3,
            status: "review",
            intervalDays: 14,
        })
        expect(subject.ladderScheduler.schedule({ step: NEW_STEP }, "hard")).toEqual({
            step: 0,
            status: "learning",
            intervalDays: 1,
        })
    })

    it("moves good one step up and easy two, learning until step 2", () => {
        expect(subject.ladderScheduler.schedule({ step: NEW_STEP }, "good")).toEqual({
            step: 0,
            status: "learning",
            intervalDays: 1,
        })
        expect(subject.ladderScheduler.schedule({ step: 0 }, "good")).toEqual({
            step: 1,
            status: "learning",
            intervalDays: 3,
        })
        expect(subject.ladderScheduler.schedule({ step: 0 }, "easy")).toEqual({
            step: 2,
            status: "review",
            intervalDays: 7,
        })
    })

    it("stops at the last step of the ladder", () => {
        expect(subject.ladderScheduler.schedule({ step: 7 }, "easy")).toEqual({
            step: 7,
            status: "review",
            intervalDays: 180,
        })
        expect(REVIEW_LADDER).toEqual([1, 3, 7, 14, 30, 60, 120, 180])
    })
})

describe("ladderScheduler preview", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("shows the days each of the four buttons would give", () => {
        expect(subject.ladderScheduler.preview({ step: 1 })).toEqual({ again: 0, hard: 3, good: 7, easy: 14 })
    })
})

describe("ladderScheduler scheduleRetrieval", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("closes a retrieval item graded good or easy", () => {
        expect(subject.ladderScheduler.scheduleRetrieval("good")).toEqual({ status: "done", intervalDays: 0 })
        expect(subject.ladderScheduler.scheduleRetrieval("easy")).toEqual({ status: "done", intervalDays: 0 })
    })

    it("asks once more after three days when the answer was weak", () => {
        expect(subject.ladderScheduler.scheduleRetrieval("again")).toEqual({ status: "learning", intervalDays: 3 })
        expect(subject.ladderScheduler.scheduleRetrieval("hard")).toEqual({ status: "learning", intervalDays: 3 })
    })
})
