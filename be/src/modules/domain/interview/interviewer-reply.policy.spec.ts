import { Test } from "@nestjs/testing"
import { MAX_INTERVIEWER_TEXT, interviewerDecisionOf, objectTextOf, parsedJsonOf } from "./interviewer-reply.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { interviewerDecisionOf, objectTextOf, parsedJsonOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.interviewer-reply.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

/** The error a call throws, or null when it returns. */
const failureOf = (run: () => unknown): unknown => {
    try {
        run()
    } catch (error) {
        return error
    }
    return null
}

describe("interviewerDecisionOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads a follow-up and a probe with their words, trimmed", () => {
        expect(subject.interviewerDecisionOf('{"action":"followUp","text":"  Why?  "}')).toEqual({
            action: "followUp",
            text: "Why?",
        })
        expect(subject.interviewerDecisionOf('Sure! {"action":"probe","text":"What did you do?"} Done.')).toEqual({
            action: "probe",
            text: "What did you do?",
        })
    })

    it("reads next as saying nothing, whatever text came with it", () => {
        expect(subject.interviewerDecisionOf('{"action":"next","text":"Good job!"}')).toEqual({
            action: "next",
            text: "",
        })
        expect(subject.interviewerDecisionOf('{"action":"next"}')).toEqual({ action: "next", text: "" })
    })

    it.each([
        ["not json", "nope"],
        ["not an object", "5"],
        ["an array", "[1]"],
        ["an unknown action", '{"action":"grade","text":"x"}'],
        ["a follow-up with no words", '{"action":"followUp","text":" "}'],
        ["a follow-up with a non-text", '{"action":"probe","text":3}'],
        ["too many words", `{"action":"probe","text":"${"x".repeat(MAX_INTERVIEWER_TEXT + 1)}"}`],
    ])("refuses %s as INTERVIEW_COACH_INVALID", (_case, text) => {
        expect(failureOf(() => subject.interviewerDecisionOf(text))).toMatchObject({ code: "INTERVIEW_COACH_INVALID" })
    })

    it("cuts the object out of a wrapped text, or leaves the text when there is none", () => {
        expect(subject.objectTextOf('x {"a":1} y')).toBe('{"a":1}')
        expect(subject.objectTextOf("no braces")).toBe("no braces")
        expect(subject.objectTextOf("} {")).toBe("} {")
        expect(subject.parsedJsonOf('{"a":1}')).toEqual({ a: 1 })
    })
})
