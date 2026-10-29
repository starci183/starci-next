import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { CommerceOptions } from "./commerce.options"

/** The configurable-module base of the commerce module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<CommerceOptions>().setClassMethodName("register").build()
