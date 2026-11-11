import { Test } from "@nestjs/testing"
import { demoLocaleDocumentOf } from "@tests/fixtures/builders/lesson.builder"
import { outlineOf } from "./lesson-outline.policy"

const OUTLINE_POLICY: unique symbol = Symbol("lesson.outline-policy")

const build = async (): Promise<typeof outlineOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: OUTLINE_POLICY, useFactory: () => outlineOf }],
    }).compile()
    return moduleRef.get<typeof outlineOf>(OUTLINE_POLICY)
}

describe("outlineOf", () => {
    it("lists the outcomes and every section activity with its phase, outcomes and diagnostic mark", async () => {
        const outline = await build()

        const result = outline(demoLocaleDocumentOf("vi"))

        expect(result.outcomeIds).toEqual(["demo--o1", "demo--o2"])
        expect(result.activities.map((entry) => `${entry.phase}:${entry.id}:${entry.isDiagnostic}`)).toEqual([
            "challenge:demo--interview:true",
            "predict:demo--predict:false",
            "explore:demo--explore:false",
            "apply:demo--practice:false",
            "reflect:demo--final:true",
        ])
        expect(result.activities[0]?.outcomeIds).toEqual(["demo--o1", "demo--o2"])
    })

    it("keeps the expected evidence of each criterion for the server side only", async () => {
        const outline = await build()

        const [interview] = outline(demoLocaleDocumentOf("vi")).activities

        expect(Object.keys(interview?.expectedEvidence ?? {})).toEqual(["demo--interview--c1", "demo--interview--c2"])
    })

    it("gives an activity without a rubric no evidence", async () => {
        const outline = await build()

        const predict = outline(demoLocaleDocumentOf("vi")).activities[1]

        expect(predict?.expectedEvidence).toEqual({})
    })
})
