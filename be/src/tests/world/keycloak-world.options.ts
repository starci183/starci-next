import type { ModuleFactory } from "@starci/test-world"
import { KeycloakModule } from "@modules/integrations/keycloak"
import { Secret } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"
import { OIDC_FAKE_CLIENT_ID, oidcIssuerOf } from "./fakes/oidc-issuer/oidc-issuer.client"

/** The registered callback of the social flow, as the keycloak world's client registers it. */
export const SOCIAL_CALLBACK_URI = "https://app.test/sign-in/callback"

/** The modules of the keycloak world: the bounded http client trusting the run CA, then the gateway over the issuer fake. */
export const keycloakModules: ReadonlyArray<ModuleFactory> = [
    (w) => {
        const ca = w.fake.idp?.ca
        return HttpModule.register({ isGlobal: true, ...(ca === undefined ? {} : { trustedCa: ca }) })
    },
    (w) =>
        KeycloakModule.register({
            isGlobal: true,
            issuer: oidcIssuerOf(w.fake.idp?.url ?? ""),
            clientId: OIDC_FAKE_CLIENT_ID,
            clientSecret: new Secret(w.fake.idp?.values.clientSecret ?? ""),
            socialCallbackUri: SOCIAL_CALLBACK_URI,
            timeoutMs: 2000,
        }),
]
