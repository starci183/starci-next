import { defineCapabilityModule } from "@starci/nest-kit"
import { IDENTITY_OPTIONS } from "./identity.decorators"
import type { IdentityOptions } from "./identity.options"

/** The configurable-module base of the identity capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<IdentityOptions>({
    optionsInjectionToken: IDENTITY_OPTIONS,
})
