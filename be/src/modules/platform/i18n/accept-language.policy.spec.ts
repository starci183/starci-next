import { Test } from "@nestjs/testing"
import { localeOfAcceptLanguage } from "./accept-language.policy"

const POLICY: unique symbol = Symbol("i18n.accept-language-policy")
const policies = { localeOfAcceptLanguage }

describe("accept-language policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it.each([
        ["en-US,en;q=0.9,vi;q=0.8", "en"],
        ["vi-VN,vi;q=0.9", "vi"],
        ["fr-FR, de;q=0.8, en;q=0.5", "en"],
    ])("picks the first supported language of %s", (header, expected) => {
        expect(subject.localeOfAcceptLanguage(header)).toBe(expected)
    })

    it("joins a header sent as several lines", () => {
        expect(subject.localeOfAcceptLanguage(["fr", "en-GB"])).toBe("en")
    })

    it("answers Vietnamese when nothing supported is listed or the header is absent", () => {
        expect(subject.localeOfAcceptLanguage("fr, de")).toBe("vi")
        expect(subject.localeOfAcceptLanguage(undefined)).toBe("vi")
    })
})
