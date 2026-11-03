import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { IdentityErrorCode } from "./errors/identity.error"
import type { IdentityRedirectView, IdentityResponseWriter } from "./session-http.contracts"
import type { IdentitySessionView } from "./session.contracts"
import {
    toIdentityCallback,
    toIdentityReference,
    writeIdentityLogout,
    writeIdentityRedirect,
    writeIdentitySession,
} from "./session-http.mapper"

const MAPPERS: unique symbol = Symbol("identity.session-mappers")
const mappers = {
    toIdentityCallback,
    toIdentityReference,
    writeIdentityLogout,
    writeIdentityRedirect,
    writeIdentitySession,
}
const reference = "r".repeat(43)
const binding = "b".repeat(43)
const redirectOf = builder<IdentityRedirectView>({ url: "/sign-in?auth=success", cookies: ["session-cookie"] })
const viewOf = builder<IdentitySessionView>({
    identity: { issuer: "https://identity.example/realm", subject: "learner", roles: [] },
    expiresAt: "2026-01-01T01:00:00.000Z",
})

describe("session HTTP mapping", () => {
    let subject: typeof mappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPERS, useFactory: () => mappers }],
        }).compile()
        subject = moduleRef.get<typeof mappers>(MAPPERS)
    })
    it("narrows callback fields and reads separate host-only credentials", () => {
        const query = {
            state: "state",
            code: "code",
            iss: "https://identity.example/realm",
            role: "admin",
            redirect: "https://foreign.example",
        }
        expect(
            subject.toIdentityCallback(query, `__Host-identity_login=${binding}; __Host-identity_session=${reference}`),
        ).toEqual({
            state: "state",
            code: "code",
            issuer: "https://identity.example/realm",
            error: undefined,
            binding,
            sessionReference: reference,
        })
        expect(subject.toIdentityReference(`__Host-identity_session=${reference}`)).toBe(reference)
    })
    it("refuses duplicate query shapes and never copies provider refusal text", () => {
        expect(
            subject.toIdentityCallback(
                { state: ["one", "two"], code: {}, iss: ["one", "two"], error: "secret provider prose" },
                undefined,
            ),
        ).toEqual({
            state: undefined,
            code: undefined,
            issuer: "",
            error: "provider-refused",
            binding: undefined,
            sessionReference: undefined,
        })
        expect(subject.toIdentityCallback({}, undefined).issuer).toBeUndefined()
    })
    it("writes fixed callback navigation without serializing internal failure evidence", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeIdentityRedirect(response, redirectOf({ cause: new Error("internal") }))
        expect(response.setHeader.mock.calls).toEqual([
            ["Cache-Control", "no-store"],
            ["Set-Cookie", ["session-cookie"]],
        ])
        expect(response.redirect.mock.calls).toEqual([[303, "/sign-in?auth=success"]])
    })
})

describe("session HTTP mapping", () => {
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
    it("navigates to the provider only after successful durable local revocation", () => {
        const response = mock<IdentityResponseWriter>()
        subject.writeIdentityLogout(response, {
            kind: "ok",
            value: redirectOf({ url: "https://identity.example/logout" }),
            cookies: ["deleted"],
        })
        expect(response.redirect.mock.calls).toEqual([[303, "https://identity.example/logout"]])
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
