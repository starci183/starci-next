import type { EnvSource } from "@modules/platform/config"
import type { KeycloakOptions } from "./keycloak.options"
import { validateKeycloakOptions } from "./keycloak.policy"

/** Parses required deployment and custody references; pure registration policy validates the resulting options. */
export const parseKeycloakConfig = (env: EnvSource): KeycloakOptions => {
    env.string("IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE")
    return validateKeycloakOptions({
        issuer: env.url("IDENTITY_KEYCLOAK_ISSUER"),
        clientId: env.string("IDENTITY_KEYCLOAK_CLIENT_ID"),
        clientSecret: env.secret("IDENTITY_KEYCLOAK_CLIENT_SECRET"),
        callbackUri: env.url("IDENTITY_KEYCLOAK_CALLBACK_URI"),
        postLogoutUri: env.url("IDENTITY_KEYCLOAK_POST_LOGOUT_URI"),
        timeoutMs: env.int("IDENTITY_PROVIDER_TIMEOUT_MS", 10000),
    })
}
