import type { ExecutionContext } from "@nestjs/common"
import type { HttpArgumentsHost } from "@nestjs/common/interfaces"
import { Reflector } from "@nestjs/core"
import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { SessionService } from "./session.service"
import { IdentityError } from "./errors/identity.error"
import { AuthGuard } from "./auth.guard"
import type { CredentialMetadata, CredentialPrincipal } from "./credential.contracts"
import { IdentityErrorCode } from "./errors/identity.error"
import type { PublicMetadata } from "./identity.contracts"
import { PublicReason } from "./identity.contracts"
import { CREDENTIAL_KEY, PUBLIC_KEY } from "./identity.decorators"

interface Door {
    readonly credential?: CredentialMetadata
    readonly metadata?: PublicMetadata
    readonly principal?: CredentialPrincipal
}

const build = async ({ credential, metadata }: Door) => {
    const sessions = mock<SessionService>()
    sessions.require.mockRejectedValue(new IdentityError({ code: IdentityErrorCode.SessionRequired }))
    const reflector = mock<Reflector>()
    reflector.getAllAndOverride.mockImplementation((key: unknown) =>
        key === CREDENTIAL_KEY ? credential : key === PUBLIC_KEY ? metadata : undefined,
    )
    const moduleRef = await Test.createTestingModule({
        providers: [
            AuthGuard,
            { provide: Reflector, useValue: reflector },
            { provide: SessionService, useValue: sessions },
        ],
    }).compile()
    return { guard: moduleRef.get(AuthGuard), sessions }
}

const contextOf = (principal?: CredentialPrincipal) => {
    const context = mock<ExecutionContext>()
    context.getHandler.mockReturnValue(() => undefined)
    context.getClass.mockReturnValue(class DoorClass {})
    context.getType.mockReturnValue("http")
    const host = mock<HttpArgumentsHost>()
    host.getRequest.mockReturnValue({ credentialPrincipal: principal, headers: {} })
    context.switchToHttp.mockReturnValue(host)
    return context
}

const API_KEY: CredentialPrincipal = { kind: "api-key", subject: "key-1", workspaceId: "ws-1" }

describe("AuthGuard", () => {
    it("refuses an unknown public reason without trying to authenticate it as a session door", async () => {
        const { guard, sessions } = await build({ metadata: mock<PublicMetadata>() })
        await expect(guard.canActivate(contextOf())).rejects.toThrow(IdentityErrorCode.Unauthenticated)
        expect(sessions.require.mock.calls).toEqual([])
    })
    it("admits a protected door only after a fresh durable session read", async () => {
        const { guard, sessions } = await build({})
        sessions.require.mockResolvedValue({
            identity: { issuer: "https://id.example/realm", subject: "learner", roles: [] },
            expiresAt: "2026-01-01T01:00:00.000Z",
        })
        await expect(guard.canActivate(contextOf())).resolves.toBe(true)
    })

    it("lets a door through when it states why it is public", async () => {
        const { guard } = await build({ metadata: { reason: PublicReason.Health } })

        await expect(guard.canActivate(contextOf())).resolves.toBe(true)
    })

    it("refuses every door that is neither public nor credential-marked", async () => {
        const { guard } = await build({})

        await expect(guard.canActivate(contextOf())).rejects.toThrow(IdentityErrorCode.SessionRequired)
    })

    it("lets a credential door through once the credential principal is set", async () => {
        const { guard } = await build({ credential: { kind: "api-key" } })

        await expect(guard.canActivate(contextOf(API_KEY))).resolves.toBe(true)
    })

    it("refuses a credential door without a credential principal", async () => {
        const { guard } = await build({ credential: { kind: "api-key" } })

        await expect(guard.canActivate(contextOf())).rejects.toThrow(IdentityErrorCode.Unauthenticated)
    })
})
