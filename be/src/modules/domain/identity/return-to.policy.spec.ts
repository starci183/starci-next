import { Test } from "@nestjs/testing"
import { safeReturnTo } from "./return-to.policy"

const POLICY: unique symbol = Symbol("identity.return-to-policy")
const policies = { safeReturnTo }

describe("return-to policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it.each(["/", "/courses/intro", "/courses/intro?lesson=2#top", "/signin", "/sign-index"])(
        "keeps the same-origin path %s",
        (path) => {
            expect(subject.safeReturnTo(path)).toBe(path)
        },
    )

    it.each([
        undefined,
        "",
        "courses",
        "https://evil.example/",
        "javascript:alert(1)",
        "//evil.example",
        "/\\evil.example",
        "/ok\\path",
        "/line\nbreak",
        "/tab\tstop",
        "/delete\u007f",
        "/sign-in",
        "/sign-in?returnTo=/x",
        "/sign-in#top",
        "/Sign-In/callback",
        `/${"a".repeat(2048)}`,
    ])("falls back to the home page for %j", (raw) => {
        expect(subject.safeReturnTo(raw)).toBe("/")
    })
})
