import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { EntitlementOptions } from "./entitlement.options"

/** Configurable-module base; the app root decides whether it is global. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<EntitlementOptions>()
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
