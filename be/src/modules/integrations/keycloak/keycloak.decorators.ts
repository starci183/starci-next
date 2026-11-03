import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { KeycloakClient } from "./keycloak.client"
import type { KeycloakOptions } from "./keycloak.options"

/** Token of the single registered provider adapter. */
export const KEYCLOAK: unique symbol = Symbol("integrations.keycloak")
/** Token of validated registered-client options. */
export const KEYCLOAK_OPTIONS: unique symbol = Symbol("integrations.keycloak.options")

/** Injects the provider adapter. Parameter type: KeycloakClient. */
export const InjectKeycloak = (): TypedParameterDecorator<KeycloakClient> => injector<KeycloakClient>(KEYCLOAK)
/** Injects validated client configuration. Parameter type: KeycloakOptions. */
export const InjectKeycloakOptions = (): TypedParameterDecorator<KeycloakOptions> =>
    injector<KeycloakOptions>(KEYCLOAK_OPTIONS)
