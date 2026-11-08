import { Test } from "@nestjs/testing"
import { CareerErrorCode } from "./errors/career.error"
import { EXPERIENCE_CATALOG, EXPERIENCE_PARTS, catalogItemOf, templateOf } from "./experience-catalog.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { catalogItemOf, templateOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.experience-catalog")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

describe("the experience catalog", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("grants CV lines only from Projects, Incidents and Essentials attached to a project", () => {
        const cvParts = new Set(EXPERIENCE_CATALOG.filter((i) => i.output === "cv-line").map((i) => i.part))

        expect([...cvParts].sort()).toEqual(["essentials", "incidents", "projects"])
        expect(subject.catalogItemOf("essentials.concept-proved").requiresProject).toBe(true)
    })

    it("feeds hiring readiness from Coding practice and Mock interview", () => {
        const readiness = EXPERIENCE_CATALOG.filter((i) => i.output === "readiness").map((i) => i.part)

        expect(readiness.sort()).toEqual(["interview", "practice"])
    })

    it("carries every slot in both templates, and only the parts that grant items", () => {
        for (const item of EXPERIENCE_CATALOG) {
            for (const slot of item.slots) {
                expect(subject.templateOf(item.itemType).vi).toContain(`<${slot}>`)
                expect(subject.templateOf(item.itemType).en).toContain(`<${slot}>`)
            }
            expect(EXPERIENCE_PARTS).toContain(item.part)
        }
    })

    it("refuses a template for an item type it does not hold", () => {
        expect(() => subject.templateOf("hub.streak")).toThrow(CareerErrorCode.ItemTypeUnknown)
    })

    it("refuses an item type it does not hold", () => {
        expect(() => subject.catalogItemOf("hub.streak")).toThrow(CareerErrorCode.ItemTypeUnknown)
    })
})
