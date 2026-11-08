import { Test } from "@nestjs/testing"
import { builder, mock } from "@starci/jest-preset"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { IdentitySessionView } from "./session.contracts"
import { SessionService } from "./session.service"
import { SessionHttpService } from "./session-http.service"

const ATTRIBUTES = "Path=/; Secure; HttpOnly; SameSite=Lax"
const SESSION_DELETED = `__Host-identity_session=; ${ATTRIBUTES}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
const viewOf = builder<IdentitySessionView>({
    identity: { subject: "learner", roles: [], displayName: null, email: null },
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

    describe("signOut", () => {
        it("clears the cookie after durable revocation", async () => {
            const { service, sessions } = await build()
            sessions.signOut.mockResolvedValue()
            await expect(service.signOut("opaque")).resolves.toEqual({
                kind: "ok",
                value: null,
                cookies: [SESSION_DELETED],
            })
            expect(sessions.signOut).toHaveBeenCalledWith("opaque")
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
