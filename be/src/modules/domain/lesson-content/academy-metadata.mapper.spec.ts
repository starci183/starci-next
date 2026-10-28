import { Test } from "@nestjs/testing"
import { LessonContentErrorCode } from "./errors/lesson-content.error"
import { parseLessonMetadata } from "./academy-metadata.mapper"

const SEPARATOR = "<!-- @starci/seperator -->"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const leaf = (name: string, value: string): string => `# ${name}\n${SEPARATOR}\n${value}\n${SEPARATOR}\n`

const metadata = (extra: string = "", verified: string = leaf("verified", "2026-06-02")): Uint8Array =>
    encode(
        `${leaf("sortIndex", "1")}${leaf("title", "Title")}${leaf("description", "Desc")}${leaf("minutesRead", "20")}${leaf("isPremium", "false")}${verified}${extra}`,
    )

const SUBJECT = Symbol("academy-metadata")
const helpers = { parseLessonMetadata }

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("parseLessonMetadata", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("reads the flat leaf map", () => {
        const parsed = subject.parseLessonMetadata(metadata())

        expect(parsed).toEqual({
            title: "Title",
            description: "Desc",
            minutesRead: 20,
            isPremium: false,
            verifiedAt: "2026-06-02",
        })
    })

    it("answers a null verified stamp when the leaf is absent", () => {
        expect(subject.parseLessonMetadata(metadata("", "")).verifiedAt).toBeNull()
    })

    it("refuses unknown fields", () => {
        expect(() => subject.parseLessonMetadata(metadata(leaf("answer", "x")))).toThrow(
            LessonContentErrorCode.ClassificationUnknown,
        )
    })

    it("refuses a non-positive minutesRead", () => {
        const raw = encode(
            `${leaf("sortIndex", "1")}${leaf("title", "T")}${leaf("description", "D")}${leaf("minutesRead", "0")}${leaf("isPremium", "true")}`,
        )

        expect(() => subject.parseLessonMetadata(raw)).toThrow(LessonContentErrorCode.SourceMalformed)
    })
})
