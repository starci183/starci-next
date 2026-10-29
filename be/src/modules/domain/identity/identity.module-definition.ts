import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { IdentityOptions } from "./identity.options"
import { IDENTITY_OPTIONS } from "./identity.decorators"

/** The configurable-module base of the identity capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<IdentityOptions>({
    optionsInjectionToken: IDENTITY_OPTIONS,
})
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
