import { defineCapabilityModule } from "@starci/nest-kit"
import { SEPAY_OPTIONS } from "./sepay.decorators"
import type { SepayModuleOptions } from "./sepay.options"

/** The configurable-module base of the SePay rail; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<SepayModuleOptions>({
    optionsInjectionToken: SEPAY_OPTIONS,
})
