import { defineConfigurableModule } from "@starci/nest-kit"
import type { EntitlementCliOptions } from "./entitlement.options"

/** The configurable-module base of the entitlement command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<EntitlementCliOptions>()
