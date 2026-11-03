import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { IdentitySessionView } from "./session.contracts"
import { SessionService } from "./session.service"
import { SessionHttpService } from "./session-http.service"

const ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Lax"
const LOGIN_DELETED = `__Host-identity_login=; ${ATTRIBUTES}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
const SESSION_DELETED = `__Host-identity_session=; ${ATTRIBUTES}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
const viewOf = builder<IdentitySessionView>({
    identity: { issuer: "https://identity.example/realm", subject: "learner", roles: [] },
    expiresAt: "2026-01-01T01:00:00.000Z",
})
const build = async () => {
    const sessions = mock<SessionService>()
    const moduleRef = await Test.createTestingModule({
        providers: [SessionHttpService, { provide: SessionService, useValue: sessions }],
    }).compile()
    return { service: moduleRef.get(SessionHttpService), sessions }
}

describe("SessionHttpService", () => {
    describe("start", () => {
        it("issues a distinct host-only transaction cookie with the recorded lifetime", async () => {
            const { service, sessions } = await build()
            sessions.start.mockResolvedValue({
                authorizationUrl: "https://identity.example/auth",
                binding: "binding",
                maxAgeSeconds: 300,
            })
            await expect(service.start()).resolves.toEqual({
                url: "https://identity.example/auth",
                cookies: [`__Host-identity_login=binding; ${ATTRIBUTES}; Max-Age=300`],
            })
        })
    })
    describe("callback", () => {
        it("sets the opaque session cookie and clears the login cookie on the fixed success redirect", async () => {
            const { service, sessions } = await build()
            sessions.callback.mockResolvedValue({ kind: "success", reference: "opaque", maxAgeSeconds: 60 })
            await expect(service.callback({})).resolves.toEqual({
                url: "/sign-in?auth=success",
                cookies: [LOGIN_DELETED, `__Host-identity_session=opaque; ${ATTRIBUTES}; Max-Age=60`],
            })
        })
        it("clears both cookies and never forwards provider input on any failure", async () => {
            const { service, sessions } = await build()
            const cause = new Error("provider detail")
            sessions.callback.mockResolvedValue({ kind: "error", cause })
            await expect(service.callback({ code: "secret", error: "provider text" })).resolves.toEqual({
                url: "/sign-in?auth=error",
                cookies: [LOGIN_DELETED, SESSION_DELETED],
                cause,
            })
        })
        it("maps an expected refusal with no exceptional cause", async () => {
            const { service, sessions } = await build()
            sessions.callback.mockResolvedValue({ kind: "error" })
            await expect(service.callback({})).resolves.toEqual({
                url: "/sign-in?auth=error",
                cookies: [LOGIN_DELETED, SESSION_DELETED],
                cause: undefined,
            })
        })
    })
})

describe("SessionHttpService", () => {
    describe("current", () => {
        it("returns the exact authenticated response with no credential or inferred learner role", async () => {
            const { service, sessions } = await build()
            sessions.require.mockResolvedValue(viewOf())
            await expect(service.current("opaque")).resolves.toEqual({ kind: "ok", value: viewOf(), cookies: [] })
        })
        it.each([IdentityErrorCode.SessionRequired, IdentityErrorCode.SessionUnavailable])(
            "clears the cookie on an explicit session refusal",
            async (code) => {
                const { service, sessions } = await build()
                const cause = new IdentityError({ code })
                sessions.require.mockRejectedValue(cause)
                await expect(service.current(undefined)).resolves.toEqual({
                    kind: "refused",
                    code,
                    cause,
                    cookies: [SESSION_DELETED],
                })
            },
        )
        it("masks unexpected read failures as unavailable while retaining their cause", async () => {
            const { service, sessions } = await build()
            const cause = new Error("database unavailable")
            sessions.require.mockRejectedValue(cause)
            await expect(service.current("opaque")).resolves.toEqual({
                kind: "refused",
                code: IdentityErrorCode.SessionUnavailable,
                cause,
                cookies: [SESSION_DELETED],
            })
        })
    })
})

describe("SessionHttpService", () => {
    describe("signOut", () => {
        it("clears the cookie before the provider destination is sent", async () => {
            const { service, sessions } = await build()
            sessions.signOut.mockResolvedValue({ redirectUrl: "https://identity.example/logout" })
            await expect(service.signOut("opaque")).resolves.toEqual({
                kind: "ok",
                value: { url: "https://identity.example/logout", cookies: [SESSION_DELETED], cause: undefined },
                cookies: [SESSION_DELETED],
            })
        })
        it("clears the cookie even when durable revocation cannot be confirmed", async () => {
            const { service, sessions } = await build()
            const cause = new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
            sessions.signOut.mockRejectedValue(cause)
            await expect(service.signOut("opaque")).resolves.toEqual({
                kind: "refused",
                code: IdentityErrorCode.SessionUnavailable,
                cause,
                cookies: [SESSION_DELETED],
            })
        })
    })
})
