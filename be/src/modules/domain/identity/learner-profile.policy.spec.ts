import { Test } from "@nestjs/testing"
import { DISPLAY_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH, toLearnerProfile } from "./learner-profile.policy"

const POLICY: unique symbol = Symbol("identity.learner-profile-policy")
const policies = { toLearnerProfile }
const claims = (overrides: Partial<Parameters<typeof toLearnerProfile>[0]> = {}) => ({
    username: "ada.l",
    name: "Ada Lovelace",
    email: "ada@example.com",
    ...overrides,
})

describe("learner profile policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it("shows the preferred username and the email when the token has both", () => {
        expect(subject.toLearnerProfile(claims())).toEqual({ displayName: "ada.l", email: "ada@example.com" })
    })

    it.each([[undefined], [null], [""], ["   "], [7], [{ text: "ada" }], ["\u0000\u0007"]])(
        "falls back to the name when the preferred username is %j",
        (username) => {
            expect(subject.toLearnerProfile(claims({ username })).displayName).toBe("Ada Lovelace")
        },
    )

    it.each([[undefined], [null], [""], [" \t "], [42], [["Ada"]]])(
        "stores null for the name when neither claim is usable (name %j)",
        (name) => {
            expect(subject.toLearnerProfile(claims({ username: undefined, name })).displayName).toBeNull()
        },
    )

    it.each([[undefined], [null], [""], [" "], [5], [{}], ["no-at-sign"], ["two@@signs.test"], ["a b@c.test"]])(
        "stores null for the email when the claim is %j",
        (email) => {
            expect(subject.toLearnerProfile(claims({ email })).email).toBeNull()
        },
    )

    it("trims the ends of the name and the email", () => {
        expect(subject.toLearnerProfile(claims({ username: "  Ada L  ", email: "\tada@example.com\n" }))).toEqual({
            displayName: "Ada L",
            email: "ada@example.com",
        })
    })

    it.each([
        ["control characters", "Ada\u0000\u0007\u001b[31mL\u007f", "Ada[31mL"],
        ["line breaks and tabs", "Ada\r\nLo\tvelace", "AdaLovelace"],
        ["bidirectional overrides and zero-width marks", "\u{202E}Ada\u200b L", "Ada L"],
        ["line and paragraph separators", "Ada\u2028L\u2029", "AdaL"],
    ])("strips %s from the name", (_what, raw, clean) => {
        expect(subject.toLearnerProfile(claims({ username: raw })).displayName).toBe(clean)
    })

    it("strips control characters from the email and refuses what is left when it is not an address", () => {
        expect(subject.toLearnerProfile(claims({ email: "ada@\u0000example.com" })).email).toBe("ada@example.com")
        expect(subject.toLearnerProfile(claims({ email: "\u0000\u0007" })).email).toBeNull()
    })

    it("cuts an over-long name at the cap without splitting a character", () => {
        const long = `${"a".repeat(DISPLAY_NAME_MAX_LENGTH - 1)}\u{1F600}\u{1F600}`
        const name = subject.toLearnerProfile(claims({ username: long })).displayName
        expect(Array.from(name ?? "")).toHaveLength(DISPLAY_NAME_MAX_LENGTH)
        expect(name?.endsWith("\u{1F600}")).toBe(true)
    })

    it("keeps a name of exactly the cap whole", () => {
        const exact = "n".repeat(DISPLAY_NAME_MAX_LENGTH)
        expect(subject.toLearnerProfile(claims({ username: exact })).displayName).toBe(exact)
    })

    it("keeps an email of exactly the cap and refuses a longer one rather than cut it", () => {
        const local = "e".repeat(EMAIL_MAX_LENGTH - "@x.test".length)
        expect(subject.toLearnerProfile(claims({ email: `${local}@x.test` })).email).toBe(`${local}@x.test`)
        expect(subject.toLearnerProfile(claims({ email: `${local}e@x.test` })).email).toBeNull()
    })
})
