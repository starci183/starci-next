import type { EnvSource } from "@modules/platform/config"
import type { KeycloakOptions } from "./keycloak.options"

const DEFAULT_TIMEOUT_MS = 10000

/** Parses the registered confidential client; the package validates the addresses at registration, and only the deadline has a default. */
export const parseKeycloakConfig = (env: EnvSource): KeycloakOptions => {
    env.string("IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE")
    return {
        issuer: env.url("IDENTITY_KEYCLOAK_ISSUER"),
        clientId: env.string("IDENTITY_KEYCLOAK_CLIENT_ID"),
        clientSecret: env.secret("IDENTITY_KEYCLOAK_CLIENT_SECRET"),
        socialCallbackUri: env.url("IDENTITY_SOCIAL_CALLBACK_URI"),
        timeoutMs: env.int("IDENTITY_PROVIDER_TIMEOUT_MS", DEFAULT_TIMEOUT_MS),
    }
}
