import type { ExecutionContext } from "@nestjs/common"
import type { HttpArgumentsHost } from "@nestjs/common/interfaces"
import { mock } from "@starci/jest-preset"
import { AuthGuard, CredentialGuard, Public, PublicReason } from "@modules/domain/identity"
import { identityModules } from "../../world/identity-world.options"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { useTestWorld } from "../../world/use-test-world"

const SESSION_REFERENCE = "r".repeat(43)

/** The doors the real Reflector reads: one protected application door and two doors stating a public reason. */
class Doors {
    protectedDoor(): void {
        // A door the guard reads only by its metadata; its body never runs.
    }

    @Public({ reason: PublicReason.Health })
    health(): void {
        // A door the guard reads only by its metadata; its body never runs.
    }

    @Public({ reason: PublicReason.AuthHandshake })
    @RateLimit(RateTier.Strict)
    handshake(): void {
        // A door the guard reads only by its metadata; its body never runs.
    }
}

/** The execution context of one admitted or refused request: its decorated door and its inbound request values. */
const contextOf = (handler: () => void, request: Record<string, unknown>): ExecutionContext => {
    const host = mock<HttpArgumentsHost>()
    host.getRequest.mockReturnValue(request)
    const context = mock<ExecutionContext>()
    context.getHandler.mockReturnValue(handler)
    context.getClass.mockReturnValue(Doors)
    context.getType.mockReturnValue("http")
    context.switchToHttp.mockReturnValue(host)
    return context
}

/**
 * identity guards: the real guard chain of the capability over the migrated primary database. Default deny holds
 * before and after a durable read: a public reason is admitted without a session lookup, a protected door with no or
 * unknown opaque credential is refused, and a cut session store fails the request closed. `CredentialGuard` leaves
 * every unmarked door to `AuthGuard`.
 */
describe("identity guards (integration)", () => {
    const world = useTestWorld({ modules: identityModules })
    const authGuard = (): AuthGuard => world.resolve(AuthGuard)
    const credentialGuard = (): CredentialGuard => world.resolve(CredentialGuard)

    it("admits a door that states a public reason without reading durable session state", async () => {
        await expect(authGuard().canActivate(contextOf(Doors.prototype.health, { headers: {} }))).resolves.toBe(true)
        await expect(authGuard().canActivate(contextOf(Doors.prototype.handshake, { headers: {} }))).resolves.toBe(true)
    })

    it("refuses a protected door carrying no session credential", async () => {
        await expect(
            authGuard().canActivate(contextOf(Doors.prototype.protectedDoor, { headers: {} })),
        ).rejects.toMatchObject({ code: "IDENTITY_SESSION_REQUIRED" })
    })

    it("refuses a protected door whose opaque credential is not a current session", async () => {
        const request = { headers: { cookie: `__Host-identity_session=${SESSION_REFERENCE}` } }

        await expect(authGuard().canActivate(contextOf(Doors.prototype.protectedDoor, request))).rejects.toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
        })
    })

    it("refuses a protected door while the durable session store is cut", async () => {
        const request = { headers: { cookie: `__Host-identity_session=${SESSION_REFERENCE}` } }

        await world.interruptDatabase(async () => {
            await expect(
                authGuard().canActivate(contextOf(Doors.prototype.protectedDoor, request)),
            ).rejects.toMatchObject({ code: "IDENTITY_SESSION_UNAVAILABLE" })
        })
    })

    it("leaves a door without a credential mark to the default-deny decision", async () => {
        await expect(
            credentialGuard().canActivate(contextOf(Doors.prototype.protectedDoor, { headers: {} })),
        ).resolves.toBe(true)
    })
})
