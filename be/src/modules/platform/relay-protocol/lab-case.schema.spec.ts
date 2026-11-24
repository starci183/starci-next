import {
    CASE_EVENT,
    caseEventInputOf,
    caseEventOfInput,
    caseTaskIdOf,
    type CaseHintEvent,
    type CaseResetEvent,
    type CaseResultEvent,
} from "./lab-case.schema"

const RESULT: CaseResultEvent = {
    type: "case.result",
    lessonId: "saga-compensation",
    caseId: "flaky-undo",
    kind: "unhappy",
    status: "red",
    ranAt: "2026-11-25T08:00:00.000Z",
    durationMs: 4200,
    learnerCommit: "a".repeat(40),
    chaos: { STOCK_OUT: "on", NET_FLAKY: "on" },
    upTo: [
        { caseId: "checkout-in-stock", status: "green" },
        { caseId: "out-of-stock", status: "green" },
        { caseId: "flaky-undo", status: "red" },
    ],
    failed: { invariant: "money-back", message: "wallet is 3800000", expected: "5000000", actual: "3800000" },
}

const HINT: CaseHintEvent = {
    type: "case.hint",
    lessonId: "saga-compensation",
    caseId: "flaky-undo",
    level: 2,
    at: "2026-11-25T08:01:00.000Z",
}

const RESET: CaseResetEvent = {
    type: "case.reset",
    lessonId: "saga-compensation",
    caseId: "flaky-undo",
    stashedBranch: "cua-toi-luu-flaky-undo",
    at: "2026-11-25T08:02:00.000Z",
}

const ENVELOPE = { eventId: "6f1c1d1e-0000-4000-8000-000000000001", taskId: caseTaskIdOf("shop-giay", "saga-compensation") }

describe("the lab case events of the relay protocol", () => {
    it("accepts each of the three events as the relay builds them", () => {
        expect([RESULT, HINT, RESET].map((event) => CASE_EVENT.safeParse(event).success)).toEqual([true, true, true])
    })

    it("refuses a hint level outside 1 to 3, a stash branch without its prefix and a commit that is not 40 hex", () => {
        expect(CASE_EVENT.safeParse({ ...HINT, level: 4 }).success).toBe(false)
        expect(CASE_EVENT.safeParse({ ...RESET, stashedBranch: "main" }).success).toBe(false)
        expect(CASE_EVENT.safeParse({ ...RESULT, learnerCommit: "HEAD" }).success).toBe(false)
    })

    it("carries an event as its upload mutation and input, chaos as a key/value list, and reads it back unchanged", () => {
        const upload = caseEventInputOf(RESULT, ENVELOPE)

        expect(upload.mutation).toBe("relayLabCaseResult")
        expect(upload.input).toMatchObject({
            eventId: ENVELOPE.eventId,
            taskId: "course:shop-giay/saga-compensation",
            chaos: [
                { key: "STOCK_OUT", value: "on" },
                { key: "NET_FLAKY", value: "on" },
            ],
        })
        expect(upload.input).not.toHaveProperty("type")
        expect(caseEventOfInput(upload.mutation, upload.input)).toEqual({ kind: "event", event: RESULT, ...ENVELOPE })
    })

    it("reads the hint and reset uploads back, and refuses an input with a field the protocol does not have", () => {
        ;[HINT, RESET].forEach((event) => {
            const upload = caseEventInputOf(event, ENVELOPE)
            expect(caseEventOfInput(upload.mutation, upload.input)).toEqual({ kind: "event", event, ...ENVELOPE })
        })
        const upload = caseEventInputOf(HINT, ENVELOPE)
        expect(caseEventOfInput(upload.mutation, { ...upload.input, extra: 1 }).kind).toBe("invalid")
        expect(caseEventOfInput(upload.mutation, { ...upload.input, eventId: undefined }).kind).toBe("invalid")
    })
})
