import { ConfigurableModuleBuilder } from "@nestjs/common"
import { SEPAY_OPTIONS } from "./sepay.options-token"
import type { SepayModuleOptions } from "./sepay.options"

/** The configurable-module base of the SePay rail; the app root decides whether it is global. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = new ConfigurableModuleBuilder<SepayModuleOptions>({
    optionsInjectionToken: SEPAY_OPTIONS,
})
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
