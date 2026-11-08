import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { KeycloakGateway } from "./keycloak.options"

/** Token of the Keycloak gateway port the identity capability injects; the adapter over @starci/auth-oidc provides it. */
export const KEYCLOAK_GATEWAY: unique symbol = Symbol("integrations.keycloak.gateway")

/** Injects the Keycloak gateway. Parameter type: KeycloakGateway. */
export const InjectKeycloakGateway = (): TypedParameterDecorator<KeycloakGateway> =>
    injector<KeycloakGateway>(KEYCLOAK_GATEWAY)
