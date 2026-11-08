import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { IdentityErrorCode } from "./errors/identity.error"
import type { IdentityResponseWriter } from "./session-http.contracts"
import type { IdentitySessionView, SessionIssued } from "./session.contracts"
import {
    toIdentityReference,
    toSocialBinding,
    writeIdentityIssued,
    writeIdentityLogout,
    writeIdentitySession,
    writeSocialBinding,
    writeSocialIssued,
} from "./session-http.mapper"

const MAPPERS: unique symbol = Symbol("identity.session-mappers")
const mappers = {
    toIdentityReference,
    toSocialBinding,
    writeIdentityIssued,
    writeIdentityLogout,
    writeIdentitySession,
    writeSocialBinding,
    writeSocialIssued,
}
const reference = "r".repeat(43)
const viewOf = builder<IdentitySessionView>({
    identity: { subject: "learner", roles: [], displayName: null, email: null },
    expiresAt: "2026-01-01T01:00:00.000Z",
})
const issuedOf = builder<SessionIssued>({
    reference,
    expiresAt: new Date("2026-01-01T01:00:00.000Z"),
    maxAgeSeconds: 3600,
})

describe("session HTTP cookie mapping", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPERS, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPERS)
    })
    it("reads the exact opaque session credential from the cookie header", () => {
        expect(subject.toIdentityReference(`__Host-identity_session=${reference}`)).toBe(reference)
        expect(subject.toIdentityReference(undefined)).toBeUndefined()
    })
    it("binds a social start to the browser with a short-lived host-only cookie holding its state", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeSocialBinding(response, {
            authorizationUrl: "https://idp",
            binding: reference,
            bindingMaxAgeSeconds: 600,
        })
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            [
                "Set-Cookie",
                [`__Host-identity_social=${reference}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`],
            ],
        ])
        expect(subject.toSocialBinding(`a=1; __Host-identity_social=${reference}`)).toBe(reference)
        expect(subject.toSocialBinding(`__Host-identity_session=${reference}`)).toBeUndefined()
    })
    it("sets the session cookie of a social sign-in and deletes its spent binding cookie", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeSocialIssued(response, { ...issuedOf(), returnTo: "/" })
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            [
                "Set-Cookie",
                [
                    `__Host-identity_session=${reference}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600`,
                    "__Host-identity_social=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
                ],
            ],
        ])
    })
})

describe("session HTTP mapping of a session", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPERS, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPERS)
    })
    it("returns the exact authenticated schema after applying no-store headers", () => {
        const response = mock<IdentityResponseWriter>()
        expect(subject.writeIdentitySession(response, { kind: "ok", value: viewOf(), cookies: [] })).toEqual(viewOf())
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            ["Set-Cookie", []],
        ])
    })
    it("applies browser cleanup before an explicit unauthenticated read refusal", () => {
        const response = mock<IdentityResponseWriter>()
        expect(() =>
            subject.writeIdentitySession(response, {
                kind: "refused",
                code: IdentityErrorCode.SessionRequired,
                cookies: ["deleted"],
            }),
        ).toThrow(IdentityErrorCode.SessionRequired)
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            ["Set-Cookie", ["deleted"]],
        ])
    })
    it("sets the host-only session cookie of an issued session with its durable lifetime", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeIdentityIssued(response, issuedOf())
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            [
                "Set-Cookie",
                [`__Host-identity_session=${reference}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600`],
            ],
        ])
    })
    it("clears the browser credential after a successful sign-out", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeIdentityLogout(response, { kind: "ok", value: null, cookies: ["deleted"] })
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            ["Set-Cookie", ["deleted"]],
        ])
    })
    it("clears the browser credential even when durable local revocation is unavailable", () => {
        const response = mock<IdentityResponseWriter>()
        expect(() =>
            subject.writeIdentityLogout(response, {
                kind: "refused",
                code: IdentityErrorCode.SessionUnavailable,
                cookies: ["deleted"],
            }),
        ).toThrow(IdentityErrorCode.SessionUnavailable)
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            ["Set-Cookie", ["deleted"]],
        ])
    })
})
