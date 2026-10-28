import { ConfigurableModuleBuilder } from "@nestjs/common"
import type { LessonsOptions } from "./lessons.options"

/** The configurable-module base of the lessons module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<LessonsOptions>().setClassMethodName("register").build()
