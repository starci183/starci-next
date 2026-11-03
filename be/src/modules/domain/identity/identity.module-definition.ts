import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { IdentityOptions } from "./identity.options"
import { IDENTITY_OPTIONS } from "./identity.decorators"

const built = new ConfigurableModuleBuilder<IdentityOptions>({ optionsInjectionToken: IDENTITY_OPTIONS })
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
type Host = ConfigurableModuleHost<IdentityOptions, "register", "create", { isGlobal: boolean }>
/** The configurable-module base of the identity capability; `isGlobal` is decided by the app root. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
export const OPTIONS_TYPE: Host["OPTIONS_TYPE"] = built.OPTIONS_TYPE
