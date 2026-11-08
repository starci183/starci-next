import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import type { MessageCatalog } from "@modules/platform/i18n"
import type { IssuedChallenge, SignInPayload } from "./challenge.contracts"
import {
    readResetPayload,
    readSignInPayload,
    readSignUpPayload,
    toChallengeView,
    toCodeMail,
    toResetChallengeView,
    toRotatedChallenge,
    toSessionTokens,
    toSignInPayload,
} from "./challenge.mapper"
import { IdentityErrorCode } from "./errors/identity.error"
import type { ChallengeRotatedRow } from "./persistence/challenges.rows"

const MAPPER: unique symbol = Symbol("identity.challenge-mapper")
const mappers = {
    readResetPayload,
    readSignInPayload,
    readSignUpPayload,
    toChallengeView,
    toCodeMail,
    toResetChallengeView,
    toRotatedChallenge,
    toSessionTokens,
    toSignInPayload,
}
const EXPIRES = new Date("2026-01-01T00:10:00.000Z")
const payloadOf = builder<SignInPayload>({
    subject: "learner-1",
    roles: ["student"],
    displayName: "ada.l",
    email: "ada@example.com",
    refreshToken: "refresh-1",
    refreshExpiresAt: "2026-01-01T01:00:00.000Z",
})
const jsonOf = (overrides: Record<string, unknown>): string => JSON.stringify({ ...payloadOf(), ...overrides })
const issuedOf = builder<IssuedChallenge>({ challenge: "c".repeat(43), code: "123456", expiresAt: EXPIRES })
const rowOf = builder<ChallengeRotatedRow>({
    purpose: "sign-in",
    email: "ada@example.com",
    locale: "vi",
    deliver: true,
    expires_at: EXPIRES,
})

describe("challenge mapping", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPER)
    })

    it("reads the sealed sign-in payload it wrote", () => {
        expect(subject.readSignInPayload(JSON.stringify(payloadOf()))).toEqual(payloadOf())
    })

    it.each([
        ["absent", {}],
        ["not text", { displayName: 7, email: ["a@b.c"] }],
    ])("reads a sign-in payload whose name and email are %s as null", (_name, overrides) => {
        const { displayName: _displayName, email: _email, ...bare } = payloadOf()
        expect(subject.readSignInPayload(JSON.stringify({ ...bare, ...overrides }))).toEqual(
            payloadOf({ displayName: null, email: null }),
        )
    })

    it.each([
        ["text that is not JSON", "{"],
        ["JSON that is not an object", "5"],
        ["JSON null", "null"],
        ["a subject that is not text", jsonOf({ subject: 7 })],
        ["roles that are not a text list", jsonOf({ roles: [1] })],
        ["roles that are not a list", jsonOf({ roles: "student" })],
        ["a refresh token that is not text", jsonOf({ refreshToken: 7 })],
        ["an expiry that is not text", jsonOf({ refreshExpiresAt: 7 })],
    ])("refuses a sign-in payload with %s as unavailable session state", (_name, text) => {
        expect(() => subject.readSignInPayload(text)).toThrow(IdentityErrorCode.SessionUnavailable)
    })

    it("reads the sealed sign-up and reset payloads and refuses malformed ones", () => {
        expect(subject.readSignUpPayload('{"email":"a@b.c","username":"ada","password":"secret1"}')).toEqual({
            email: "a@b.c",
            username: "ada",
            password: "secret1",
        })
        expect(() => subject.readSignUpPayload('{"email":1,"username":"a","password":"x"}')).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(() => subject.readSignUpPayload('{"email":"a","username":1,"password":"x"}')).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(() => subject.readSignUpPayload('{"email":"a","username":"a","password":1}')).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(subject.readResetPayload('{"subject":"learner-1"}')).toEqual({ subject: "learner-1" })
        expect(subject.readResetPayload('{"subject":null}')).toEqual({ subject: null })
        expect(() => subject.readResetPayload('{"subject":1}')).toThrow(IdentityErrorCode.SessionUnavailable)
    })
})

describe("challenge view mapping", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPER, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPER)
    })

    it("carries provider tokens through a payload and back into session material", () => {
        const tokens = {
            subject: "learner-1",
            roles: ["student"],
            displayName: "ada.l",
            email: "ada@example.com",
            refreshToken: "refresh-1",
            refreshExpiresAt: new Date("2026-01-01T01:00:00.000Z"),
        }
        expect(subject.toSignInPayload(tokens)).toEqual(payloadOf())
        expect(subject.toSessionTokens(payloadOf())).toEqual(tokens)
        expect(() => subject.toSessionTokens(payloadOf({ refreshExpiresAt: "not a date" }))).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
    })

    it("answers the masked email for a sign-in step and nothing about the account for a reset", () => {
        expect(subject.toChallengeView(issuedOf(), "ada@example.com")).toEqual({
            challenge: "c".repeat(43),
            email: "a***@example.com",
            expiresAt: EXPIRES,
        })
        expect(subject.toResetChallengeView(issuedOf())).toEqual({ challenge: "c".repeat(43), expiresAt: EXPIRES })
    })

    it("types a rotated row and refuses a purpose or language outside the closed sets", () => {
        expect(subject.toRotatedChallenge(rowOf({ purpose: "password-reset", locale: "en" }), "654321")).toEqual({
            code: "654321",
            purpose: "password-reset",
            email: "ada@example.com",
            locale: "en",
            deliver: true,
            expiresAt: EXPIRES,
        })
        expect(() => subject.toRotatedChallenge(rowOf({ purpose: "other" }), "1")).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
        expect(() => subject.toRotatedChallenge(rowOf({ locale: "fr" }), "1")).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
    })

    it("draws the code mail of a purpose from the catalog in the receiver's language", () => {
        const catalog = mock<MessageCatalog>()
        catalog.get.mockImplementation((key, params, locale) => `${locale}:${key}:${params.code}:${params.minutes}`)
        expect(subject.toCodeMail(catalog, "sign-up", "en", "123456", 10)).toEqual({
            subject: "en:mail.code.sign-up.subject:123456:10",
            text: "en:mail.code.sign-up.text:123456:10",
        })
    })
})
