import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import { KEYCLOAK_OPTIONS } from "./keycloak.decorators"
import type { KeycloakOptions } from "./keycloak.options"

const built = new ConfigurableModuleBuilder<KeycloakOptions>({
    optionsInjectionToken: KEYCLOAK_OPTIONS,
})
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
type Host = ConfigurableModuleHost<KeycloakOptions, "register", "create", { isGlobal: boolean }>
/** Leaves global registration to the app root and binds the typed options injector. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
export const OPTIONS_TYPE: Host["OPTIONS_TYPE"] = built.OPTIONS_TYPE
