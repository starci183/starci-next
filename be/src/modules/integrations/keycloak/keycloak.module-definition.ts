import { ConfigurableModuleBuilder } from "@nestjs/common"
import { KEYCLOAK_OPTIONS } from "./keycloak.decorators"
import type { KeycloakOptions } from "./keycloak.options"

/** Leaves global registration to the app root and binds the typed options injector. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<KeycloakOptions>({
    optionsInjectionToken: KEYCLOAK_OPTIONS,
})
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
