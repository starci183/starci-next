import { defineCapabilityModule } from "@starci/nest-kit"
import { ENTITLEMENT_OPTIONS } from "./entitlement.decorators"
import type { EntitlementOptions } from "./entitlement.options"

/** The configurable-module base of the entitlement capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<EntitlementOptions>({
    optionsInjectionToken: ENTITLEMENT_OPTIONS,
})
