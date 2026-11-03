import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import { ERRORS_OPTIONS } from "./errors.decorators"
import type { ErrorsOptions } from "./errors.options"

const built = new ConfigurableModuleBuilder<ErrorsOptions>({ optionsInjectionToken: ERRORS_OPTIONS })
    .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
    .build()
type Host = ConfigurableModuleHost<ErrorsOptions, "register", "create", { isGlobal: boolean }>
/** The configurable-module base of the errors capability; `isGlobal` is decided by the app root. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
export const OPTIONS_TYPE: Host["OPTIONS_TYPE"] = built.OPTIONS_TYPE
