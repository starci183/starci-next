import { Test } from "@nestjs/testing"
import * as subject from "./practice-catalog.policy"
import { PRACTICE_PATTERN_IDS, PRACTICE_PATTERNS } from "./practice-catalog.policy"

const SUBJECT: unique symbol = Symbol("practice.practice-catalog.policy")

describe("the pattern catalog", () => {
    it("holds the twenty patterns of the data, each once and titled in both locales", () => {
        expect(PRACTICE_PATTERNS).toHaveLength(20)
        expect(new Set(PRACTICE_PATTERN_IDS).size).toBe(20)
        for (const pattern of PRACTICE_PATTERNS) {
            expect(pattern.titles.vi).not.toBe("")
            expect(pattern.titles.en).not.toBe("")
        }
    })
})

describe("patternPositionOf", () => {
    let patternPositionOf: typeof subject.patternPositionOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ patternPositionOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("answers the place of a pattern in catalog order", () => {
        expect(patternPositionOf("arrays")).toBe(0)
        expect(patternPositionOf("bitManipulation")).toBe(19)
    })

    it("sorts an unknown pattern after every known one", () => {
        expect(patternPositionOf("nope")).toBe(20)
    })
})

describe("patternTitleOf", () => {
    let patternTitleOf: typeof subject.patternTitleOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ patternTitleOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("answers the title in the asked locale", () => {
        expect(patternTitleOf("twoPointers", "en")).toBe("Two pointers")
        expect(patternTitleOf("twoPointers", "vi")).toBe("Hai con tr\u1ecf")
    })

    it("titles an unknown pattern by its id", () => {
        expect(patternTitleOf("nope", "vi")).toBe("nope")
    })
})
