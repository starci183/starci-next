import { Test } from "@nestjs/testing"
import { AttemptErrorCode } from "./errors/attempt.error"
import { coachGradeOf } from "./coach-reply.policy"

const GOOD = {
    criteria: [
        { criterionId: "c1", level: 2, evidenceQuote: "the read model lags" },
        { criterionId: "c2", level: 0, evidenceQuote: "" },
    ],
}

const REPLY_POLICY: unique symbol = Symbol("attempt.coach-reply-policy")

const build = async (): Promise<typeof coachGradeOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: REPLY_POLICY, useFactory: () => coachGradeOf }],
    }).compile()
    return moduleRef.get<typeof coachGradeOf>(REPLY_POLICY)
}

const codeOf = (gradeOf: typeof coachGradeOf, text: string): unknown => {
    try {
        gradeOf(text)
    } catch (cause) {
        return cause instanceof Error && "code" in cause ? cause.code : cause
    }
    return null
}

describe("coachGradeOf", () => {
    it("reads the per-criterion levels with their quotes", async () => {
        const gradeOf = await build()

        expect(gradeOf(JSON.stringify(GOOD))).toEqual(GOOD)
    })

    it("reads the object a model wrapped in a code fence or a sentence", async () => {
        const gradeOf = await build()

        const fenced = `\`\`\`json\n${JSON.stringify(GOOD)}\n\`\`\``

        expect(gradeOf(fenced)).toEqual(GOOD)
        expect(gradeOf(`Here is the grade: ${JSON.stringify(GOOD)} Done.`)).toEqual(GOOD)
    })

    it("takes an absent quote as the empty one", async () => {
        const gradeOf = await build()

        expect(gradeOf('{"criteria":[{"criterionId":"c1","level":0}]}')).toEqual({
            criteria: [{ criterionId: "c1", level: 0, evidenceQuote: "" }],
        })
    })

    it.each([
        ["text that holds no JSON", "I cannot grade this."],
        ["a closing brace before the opening one", "} {"],
        ["JSON that is not valid", '{"criteria": [}'],
        ["a list instead of an object", "[]"],
        ["a null body", "null"],
        ["no criteria list", '{"grades":[]}'],
        ["criteria that is not a list", '{"criteria":"c1"}'],
        ["an entry that is not an object", '{"criteria":[3]}'],
        ["an entry with no criterion id", '{"criteria":[{"level":1,"evidenceQuote":"x"}]}'],
        ["a level that is not a number", '{"criteria":[{"criterionId":"c1","level":"2","evidenceQuote":"x"}]}'],
        ["a quote that is not text", '{"criteria":[{"criterionId":"c1","level":1,"evidenceQuote":7}]}'],
    ])("refuses %s as ATTEMPT_COACH_INVALID", async (_case, text) => {
        const gradeOf = await build()

        expect(codeOf(gradeOf, text)).toBe(AttemptErrorCode.CoachInvalid)
    })
})
