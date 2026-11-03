import type { ModuleFactory } from "@starci/test-world"
import { IdentityModule } from "@modules/domain/identity"
import { KeycloakModule } from "@modules/integrations/keycloak"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"

/** The modules of the identity worlds: the provider edge a real unreachable HTTPS endpoint, then the http module and the identity capability. */
export const identityModules: ReadonlyArray<ModuleFactory> = [
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
]
