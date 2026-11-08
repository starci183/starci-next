import { defineCapabilityModule } from "@starci/nest-kit"
import { PAYOS_OPTIONS } from "./payos.decorators"
import type { PayosModuleOptions } from "./payos.options"

/** The configurable-module base of the payOS rail; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<PayosModuleOptions>({
    optionsInjectionToken: PAYOS_OPTIONS,
})
