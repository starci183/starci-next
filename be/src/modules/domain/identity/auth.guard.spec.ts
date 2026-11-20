import type { ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Test } from "@nestjs/testing"
import type { Request } from "express"
import { mock } from "@starci/jest-preset"
import type { Principal } from "@modules/platform/cqrs"
import { ok, refused } from "@modules/platform/primitives"
import { PassportErrorCode } from "@modules/integrations/passport"
import type { VerifyAccessToken } from "@modules/integrations/passport"
import { AuthGuard } from "./auth.guard"
import type { CredentialMetadata, CredentialPrincipal } from "./credential.contracts"
import { IdentityErrorCode } from "./errors/identity.error"
import type { PublicMetadata } from "./identity.contracts"
import { PublicReason } from "./identity.contracts"
import type { EntityManager } from "typeorm"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ACCESS_TOKEN_VERIFIER, CREDENTIAL_KEY, PUBLIC_KEY } from "./identity.decorators"

const principal: Principal = { id: "user-1", role: "authenticated" }
const ACCOUNT = {
    id: "user-1",
    email: "ada@example.test",
    meta: { full_name: "Ada", roles: ["reviewer"] },
    disabled: false,
}
const API_KEY: CredentialPrincipal = { kind: "api-key", subject: "key-1", workspaceId: "ws-1" }
const TOOL_TOKEN: CredentialPrincipal = { kind: "tool-token", subject: "tool-1", workspaceId: "ws-1" }

/** The slice of the request the guard reads; an absent principal is an explicit undefined, never a mock function. */
interface GuardRequest {
    headers: Request["headers"]
    principal: Principal | undefined
    identityPrincipal: unknown
    credentialPrincipal: CredentialPrincipal | undefined
}

const build = async (metadata: PublicMetadata | undefined, credential?: CredentialMetadata) => {
    const verifier = mock<{ verify: VerifyAccessToken }>()
    const manager = mock<EntityManager>()
    const reflector = mock<Reflector>()
    reflector.getAllAndOverride.mockImplementation((key: unknown) =>
        key === CREDENTIAL_KEY ? credential : key === PUBLIC_KEY ? metadata : undefined,
    )
    const moduleRef = await Test.createTestingModule({
        providers: [
            AuthGuard,
            { provide: Reflector, useValue: reflector },
            { provide: ACCESS_TOKEN_VERIFIER, useFactory: () => verifier.verify },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: manager },
        ],
    }).compile()
    return { guard: moduleRef.get(AuthGuard), verify: verifier.verify, manager }
}

const contextOf = (
    authorization: string | undefined,
    credentialPrincipal?: CredentialPrincipal,
    sessionPrincipal?: Principal,
) => {
    const request: GuardRequest = {
        headers: authorization === undefined ? {} : { authorization },
        principal: sessionPrincipal,
        identityPrincipal: undefined,
        credentialPrincipal,
    }
    const http = mock<ReturnType<ExecutionContext["switchToHttp"]>>()
    http.getRequest.mockReturnValue(request)
    const context = mock<ExecutionContext>()
    context.getHandler.mockReturnValue(() => undefined)
    context.getClass.mockReturnValue(class Door {})
    context.getType.mockReturnValue("http")
    context.switchToHttp.mockReturnValue(http)
    return { context, request }
}

describe("AuthGuard", () => {
    it("lets a public door through without reading a token", async () => {
        const { guard, verify } = await build({ reason: PublicReason.Health })
        const { context } = contextOf("Bearer token")

        await expect(guard.canActivate(context)).resolves.toBe(true)

        expect(verify).not.toHaveBeenCalled()
    })

    it("admits a door that is not public for a verified bearer token and records the principal with the roles of the account", async () => {
        const { guard, verify, manager } = await build(undefined)
        verify.mockResolvedValue(ok(principal))
        manager.query.mockResolvedValue([ACCOUNT])
        const { context, request } = contextOf("Bearer signed-token")

        await expect(guard.canActivate(context)).resolves.toBe(true)

        expect(verify).toHaveBeenCalledWith("signed-token")
        expect(request.principal).toEqual({ id: "user-1", email: "ada@example.test", role: "authenticated" })
        expect(request.identityPrincipal).toEqual({
            subject: "user-1",
            roles: ["reviewer"],
            displayName: "Ada",
            email: "ada@example.test",
        })
    })

    it("refuses a verified token whose account is disabled or gone", async () => {
        const { guard, verify, manager } = await build(undefined)
        verify.mockResolvedValue(ok(principal))
        manager.query.mockResolvedValueOnce([{ ...ACCOUNT, disabled: true }]).mockResolvedValueOnce([])

        await expect(guard.canActivate(contextOf("Bearer signed-token").context)).rejects.toThrow(
            IdentityErrorCode.AccountDisabled,
        )
        await expect(guard.canActivate(contextOf("Bearer signed-token").context)).rejects.toThrow(
            IdentityErrorCode.Unauthenticated,
        )
    })
})

describe("AuthGuard guest reads", () => {
    it("takes the learner of a valid bearer on a guest-read door, and never refuses", async () => {
        const { guard, verify, manager } = await build({ reason: PublicReason.GuestRead })
        verify.mockResolvedValue(ok(principal))
        manager.query.mockResolvedValue([ACCOUNT])
        const { context, request } = contextOf("Bearer signed-token")

        await expect(guard.canActivate(context)).resolves.toBe(true)

        expect(request.principal).toEqual({ id: "user-1", email: "ada@example.test", role: "authenticated" })
    })

    it("answers as a guest, with no principal, for a missing, forged or disabled-account token", async () => {
        const { guard, verify, manager } = await build({ reason: PublicReason.GuestRead })
        verify.mockResolvedValueOnce(refused(PassportErrorCode.AccessTokenInvalid)).mockResolvedValue(ok(principal))
        manager.query.mockResolvedValue([{ ...ACCOUNT, disabled: true }])
        const missing = contextOf(undefined)
        const forged = contextOf("Bearer forged-token")
        const disabled = contextOf("Bearer signed-token")

        for (const { context, request } of [missing, forged, disabled]) {
            await expect(guard.canActivate(context)).resolves.toBe(true)
            expect(request.principal).toBeUndefined()
            expect(request.identityPrincipal).toBeUndefined()
        }
        expect(verify).toHaveBeenCalledTimes(2)
    })
})

describe("AuthGuard credential doors", () => {
    it("admits a credential door with the required principal without verifying a session token", async () => {
        const { guard, verify } = await build(undefined, { kind: "api-key" })
        verify.mockResolvedValue(ok(principal))
        const { context, request } = contextOf("Bearer signed-token", API_KEY)

        await expect(guard.canActivate(context)).resolves.toBe(true)

        expect(verify).not.toHaveBeenCalled()
        expect(request.credentialPrincipal).toEqual(API_KEY)
        expect(request.principal).toBeUndefined()
    })

    it.each([
        { label: "missing", credentialPrincipal: undefined },
        { label: "of another kind", credentialPrincipal: TOOL_TOKEN },
    ])(
        "refuses a credential door when its credential principal is $label, even with a valid session",
        async ({ credentialPrincipal }) => {
            const { guard, verify } = await build(undefined, { kind: "api-key" })
            verify.mockResolvedValue(ok(principal))
            const { context } = contextOf("Bearer signed-token", credentialPrincipal, principal)

            await expect(guard.canActivate(context)).rejects.toThrow(IdentityErrorCode.Unauthenticated)

            expect(verify).not.toHaveBeenCalled()
        },
    )

    it.each([
        { label: "missing", credentialPrincipal: undefined },
        { label: "of another kind", credentialPrincipal: TOOL_TOKEN },
    ])(
        "refuses a credential door with public metadata when its credential principal is $label",
        async ({ credentialPrincipal }) => {
            const { guard, verify } = await build({ reason: PublicReason.Health }, { kind: "api-key" })
            const { context } = contextOf("Bearer signed-token", credentialPrincipal, principal)

            await expect(guard.canActivate(context)).rejects.toThrow(IdentityErrorCode.Unauthenticated)

            expect(verify).not.toHaveBeenCalled()
        },
    )

    it("refuses a door that is not public when the token fails verification", async () => {
        const { guard, verify } = await build(undefined)
        verify.mockResolvedValue(refused(PassportErrorCode.AccessTokenInvalid))
        const { context, request } = contextOf("bearer forged-token")

        await expect(guard.canActivate(context)).rejects.toThrow(IdentityErrorCode.Unauthenticated)

        expect(request.principal).toBeUndefined()
    })

    it.each([
        ["no authorization header", undefined],
        ["another scheme", "Basic dXNlcjpwYXNz"],
        ["a scheme without a token", "Bearer"],
        ["a token followed by more text", "Bearer one two"],
    ])("refuses a door that is not public with %s, without calling the verifier", async (_label, authorization) => {
        const { guard, verify } = await build(undefined)
        const { context } = contextOf(authorization)

        await expect(guard.canActivate(context)).rejects.toThrow(IdentityErrorCode.Unauthenticated)

        expect(verify).not.toHaveBeenCalled()
    })
})
