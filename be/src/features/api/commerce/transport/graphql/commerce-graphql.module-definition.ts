import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { CommerceGraphqlOptions } from "./commerce-graphql.options"

/** The configurable-module base of the commerce-graphql module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<CommerceGraphqlOptions>().setClassMethodName("register").build()
