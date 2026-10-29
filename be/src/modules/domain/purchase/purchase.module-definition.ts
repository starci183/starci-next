import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { PurchaseOptions } from "./purchase.options"

/** Configurable-module base; the app root decides whether it is global. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<PurchaseOptions>()
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
