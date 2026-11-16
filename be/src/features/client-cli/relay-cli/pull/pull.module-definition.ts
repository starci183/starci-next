import { defineConfigurableModule } from "@starci/nest-kit"
import type { PullCliOptions } from "./pull.options"

/** The configurable-module base of the pull command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PullCliOptions>()
