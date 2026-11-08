import { Test } from "@nestjs/testing"
import { ESSENTIALS_DRAFT, ESSENTIALS_SLOTS } from "@tests/fixtures/builders/career.builder"
import { acceptLine, draftLineOf, sameLine } from "./cv-line.policy"
import { CareerErrorCode } from "./errors/career.error"
import { catalogItemOf } from "./experience-catalog.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { draftLineOf, acceptLine, sameLine }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("career.cv-line")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const ESSENTIALS = catalogItemOf("essentials.concept-proved")

describe("draftLineOf", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("fills every slot of both templates from the evidence values", () => {
        expect(subject.draftLineOf(ESSENTIALS, ESSENTIALS_SLOTS)).toEqual(ESSENTIALS_DRAFT)
    })

    it("refuses a slot the evidence left empty, so no line carries an unfilled slot", () => {
        const values = { ...ESSENTIALS_SLOTS, en: { ...ESSENTIALS_SLOTS.en, project: " " } }

        expect(() => subject.draftLineOf(ESSENTIALS, values)).toThrow(CareerErrorCode.ItemTypeUnknown)
    })

    it("refuses a slot the evidence does not hold", () => {
        const { project: _project, ...rest } = ESSENTIALS_SLOTS.vi
        const values = { ...ESSENTIALS_SLOTS, vi: rest }

        expect(() => subject.draftLineOf(ESSENTIALS, values)).toThrow(CareerErrorCode.ItemTypeUnknown)
    })
})

describe("acceptLine", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("accepts the draft as it is, trimmed", () => {
        const line = { vi: ` ${ESSENTIALS_DRAFT.vi} `, en: ESSENTIALS_DRAFT.en }

        expect(subject.acceptLine(line, ESSENTIALS_DRAFT, ESSENTIALS_SLOTS)).toEqual(ESSENTIALS_DRAFT)
    })

    it("accepts a rewording that keeps every value from the evidence", () => {
        const line = {
            vi: "Used **Request lifecycle VI** for the Shop project (**typescript**), with tests for request-lifecycle.",
            en: ESSENTIALS_DRAFT.en,
        }

        expect(subject.acceptLine(line, ESSENTIALS_DRAFT, ESSENTIALS_SLOTS).vi).toBe(line.vi)
    })

    it("refuses a line that drops a value from the evidence", () => {
        const line = { vi: ESSENTIALS_DRAFT.vi, en: "Applied request handling in a big project." }

        expect(() => subject.acceptLine(line, ESSENTIALS_DRAFT, ESSENTIALS_SLOTS)).toThrow(
            CareerErrorCode.LineSlotChanged,
        )
    })

    it("refuses a line that adds a figure the evidence does not hold", () => {
        const line = { vi: `${ESSENTIALS_DRAFT.vi} Cut errors by 80%.`, en: ESSENTIALS_DRAFT.en }

        expect(() => subject.acceptLine(line, ESSENTIALS_DRAFT, ESSENTIALS_SLOTS)).toThrow(
            CareerErrorCode.LineSlotChanged,
        )
    })
})

describe("sameLine", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("is true only for the same line in both locales", () => {
        expect(subject.sameLine(ESSENTIALS_DRAFT, { ...ESSENTIALS_DRAFT })).toBe(true)
        expect(subject.sameLine(ESSENTIALS_DRAFT, { ...ESSENTIALS_DRAFT, en: "other" })).toBe(false)
        expect(subject.sameLine(ESSENTIALS_DRAFT, { ...ESSENTIALS_DRAFT, vi: "other" })).toBe(false)
        expect(subject.sameLine(null, ESSENTIALS_DRAFT)).toBe(false)
    })
})
