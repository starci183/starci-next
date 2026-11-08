import { defineCapabilityModule } from "@starci/nest-kit"
import type { EntitlementOptions } from "./entitlement.options"

/** The configurable-module base of the entitlement capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<EntitlementOptions>()
