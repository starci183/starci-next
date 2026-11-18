import { Test } from "@nestjs/testing"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import * as subject from "./practice-page.policy"

const SUBJECT: unique symbol = Symbol("practice.practice-page.policy")

const CURSOR = { submittedAt: "2026-11-09T00:00:00.000Z", id: "30000000-0000-4000-8000-000000000002" }

const textOf = (text: string): string => Buffer.from(text, "utf8").toString("base64url")

describe("the practice history page policy", () => {
    let encodedSubmissionsCursor: typeof subject.encodedSubmissionsCursor
    let decodedSubmissionsCursor: typeof subject.decodedSubmissionsCursor
    let submissionsPageLimit: typeof subject.submissionsPageLimit

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ encodedSubmissionsCursor, decodedSubmissionsCursor, submissionsPageLimit } =
            moduleRef.get<typeof subject>(SUBJECT))
    })

    it("reads back the cursor it wrote", () => {
        expect(decodedSubmissionsCursor(encodedSubmissionsCursor(CURSOR))).toEqual(CURSOR)
    })

    it.each([
        ["text that is no cursor", "not-a-cursor"],
        ["an empty text", ""],
        ["an instant without milliseconds", textOf("2026-11-09T00:00:00Z|30000000-0000-4000-8000-000000000002")],
        ["an instant that is no date", textOf("2026-13-45T00:00:00.000Z|30000000-0000-4000-8000-000000000002")],
        ["an id that is no uuid", textOf("2026-11-09T00:00:00.000Z|x")],
        ["a third part", textOf("2026-11-09T00:00:00.000Z|30000000-0000-4000-8000-000000000002|x")],
    ])("refuses %s", (_case, text) => {
        expect(() => decodedSubmissionsCursor(text)).toThrow(
            new PracticeError({ code: PracticeErrorCode.CursorInvalid }),
        )
    })

    it("takes the setting when no limit is asked and keeps an ask within 1 and 50", () => {
        expect(submissionsPageLimit(null, 20)).toBe(20)
        expect(submissionsPageLimit(5, 20)).toBe(5)
        expect(submissionsPageLimit(0, 20)).toBe(1)
        expect(submissionsPageLimit(500, 20)).toBe(50)
        expect(submissionsPageLimit(null, 900)).toBe(50)
    })
})
