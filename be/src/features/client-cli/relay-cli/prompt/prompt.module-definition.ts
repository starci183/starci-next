import { defineConfigurableModule } from "@starci/nest-kit"
import type { PromptCliOptions } from "./prompt.options"

/** The configurable-module base of the prompt command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PromptCliOptions>()
