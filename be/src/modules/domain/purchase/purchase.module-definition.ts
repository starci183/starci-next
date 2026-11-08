import { defineCapabilityModule } from "@starci/nest-kit"
import { PURCHASE_OPTIONS } from "./purchase.decorators"
import type { PurchaseOptions } from "./purchase.options"

/** The configurable-module base of the purchase capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<PurchaseOptions>({
    optionsInjectionToken: PURCHASE_OPTIONS,
})
