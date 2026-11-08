import { Test } from "@nestjs/testing"
import { Secret } from "@modules/platform/config"
import { IdentityErrorCode } from "./errors/identity.error"
import type { IdentitySessionOptions } from "./identity.options"
import {
    pkceChallenge,
    randomReference,
    referenceDigest,
    refreshDue,
    sessionCapEnd,
    sessionExpiry,
    validateIdentityOptions,
    validReference,
} from "./session.policy"
import type { SessionTiming } from "./session.policy"

const POLICY: unique symbol = Symbol("identity.session-policy")
const policies = {
    pkceChallenge,
    randomReference,
    referenceDigest,
    refreshDue,
    sessionCapEnd,
    sessionExpiry,
    validateIdentityOptions,
    validReference,
}
const NOW = new Date("2026-01-01T00:00:00.000Z")
const at = (seconds: number): Date => new Date(NOW.getTime() + seconds * 1000)
const optionsOf = (overrides: Partial<IdentitySessionOptions> = {}): IdentitySessionOptions => ({
    sessionMaxSeconds: null,
    challengeTtlSeconds: 600,
    challengeMaxAttempts: 5,
    sessionEncryptionKey: new Secret("k".repeat(32)),
    ...overrides,
})
const timingOf = (overrides: Partial<SessionTiming> = {}): SessionTiming => ({
    issuedAt: NOW,
    expiresAt: at(3600),
    refreshExpiresAt: at(3600),
    ...overrides,
})

describe("session policy", () => {
    let subject: typeof policies
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: POLICY, useFactory: () => policies }],
        }).compile()
        subject = moduleRef.get<typeof policies>(POLICY)
    })

    it("mints fixed-length unguessable references and stores only their digest", () => {
        const reference = subject.randomReference()
        expect(subject.validReference(reference)).toBe(true)
        expect(subject.randomReference()).not.toBe(reference)
        expect(subject.referenceDigest("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
        expect(subject.validReference(undefined)).toBe(false)
        expect(subject.validReference("short")).toBe(false)
    })

    it("builds the S256 challenge of the RFC 7636 example verifier", () => {
        expect(subject.pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        )
    })

    it("admits recorded options, with and without a local maximum", () => {
        expect(subject.validateIdentityOptions(optionsOf())).toEqual(optionsOf())
        expect(subject.validateIdentityOptions(optionsOf({ sessionMaxSeconds: 3600 })).sessionMaxSeconds).toBe(3600)
    })

    it.each([
        { sessionMaxSeconds: 0 },
        { challengeTtlSeconds: 0 },
        { challengeMaxAttempts: 0 },
        { sessionEncryptionKey: new Secret("short") },
    ])("refuses a nonpositive tunable or a short sealing secret", (overrides) => {
        expect(() => subject.validateIdentityOptions(optionsOf(overrides))).toThrow(
            IdentityErrorCode.SessionUnavailable,
        )
    })

    it("ends a session at the earlier of the refresh expiry and the local maximum", () => {
        expect(subject.sessionCapEnd(NOW, null)).toBeNull()
        expect(subject.sessionCapEnd(NOW, 60)).toEqual(at(60))
        expect(subject.sessionExpiry(at(100), NOW, null)).toEqual(at(100))
        expect(subject.sessionExpiry(at(100), NOW, 60)).toEqual(at(60))
        expect(subject.sessionExpiry(at(100), NOW, 200)).toEqual(at(100))
    })

    it("refreshes only a closing refresh token that a refresh would still lengthen", () => {
        expect(subject.refreshDue(timingOf(), NOW, null)).toBe(false)
        expect(subject.refreshDue(timingOf({ refreshExpiresAt: at(300) }), NOW, null)).toBe(true)
        expect(subject.refreshDue(timingOf({ refreshExpiresAt: at(301) }), NOW, null)).toBe(false)
        expect(subject.refreshDue(timingOf({ refreshExpiresAt: at(200), expiresAt: at(200) }), NOW, 3600)).toBe(true)
        expect(subject.refreshDue(timingOf({ refreshExpiresAt: at(200), expiresAt: at(100) }), NOW, 100)).toBe(false)
    })
})
