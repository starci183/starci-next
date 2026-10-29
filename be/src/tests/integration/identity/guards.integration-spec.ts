import type { ExecutionContext } from "@nestjs/common"
import type { HttpArgumentsHost } from "@nestjs/common/interfaces"
import { mock } from "@starci/jest-preset"
import { AuthGuard, CredentialGuard, IdentityModule, Public, PublicReason } from "@modules/domain/identity"
import { KeycloakModule } from "@modules/integrations/keycloak"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"
import { useTestWorld } from "../../world/use-test-world"

const SESSION_REFERENCE = "r".repeat(43)

/** The doors the real Reflector reads: one protected application door and two doors stating a public reason. */
class Doors {
    protectedDoor(): void {}

    @Public({ reason: PublicReason.Health })
    health(): void {}

    @Public({ reason: PublicReason.AuthHandshake })
    handshake(): void {}
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
    const world = useTestWorld({
        modules: [
            () =>
                KeycloakModule.register({
                    isGlobal: true,
                    issuer: "https://127.0.0.1:1",
                    clientId: "starci-next-integration",
                    clientSecret: new Secret("starci-integration-secret"),
                    callbackUri: "https://app.test/api/identity/session/callback",
                    postLogoutUri: "https://app.test/sign-in",
                    timeoutMs: 2000,
                }),
            () => HttpModule.register({ isGlobal: true }),
            () => IdentityModule.register({ isGlobal: true, sessionMaxSeconds: 28800, transactionTtlSeconds: 300 }),
        ],
    })
    const authGuard = (): AuthGuard => world.resolve(AuthGuard)
    const credentialGuard = (): CredentialGuard => world.resolve(CredentialGuard)

    it("admits a door that states a public reason without reading durable session state", async () => {
        await expect(
            authGuard().canActivate(contextOf(Doors.prototype.health, { headers: {} })),
        ).resolves.toBe(true)
        await expect(
            authGuard().canActivate(contextOf(Doors.prototype.handshake, { headers: {} })),
        ).resolves.toBe(true)
    })

    it("refuses a protected door carrying no session credential", async () => {
        await expect(
            authGuard().canActivate(contextOf(Doors.prototype.protectedDoor, { headers: {} })),
        ).rejects.toMatchObject({ code: "IDENTITY_SESSION_REQUIRED" })
    })

    it("refuses a protected door whose opaque credential is not a current session", async () => {
        const request = { headers: { cookie: `__Host-identity_session=${SESSION_REFERENCE}` } }

        await expect(
            authGuard().canActivate(contextOf(Doors.prototype.protectedDoor, request)),
        ).rejects.toMatchObject({ code: "IDENTITY_SESSION_REQUIRED" })
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
