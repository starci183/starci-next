import { ConfigurableModuleBuilder } from "@nestjs/common"
import { PAYOS_OPTIONS } from "./payos.options-token"
import type { PayosModuleOptions } from "./payos.options"

/** The configurable-module base of the payOS rail; the app root decides whether it is global. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<PayosModuleOptions>({
    optionsInjectionToken: PAYOS_OPTIONS,
})
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
