import { defineConfigurableModule } from "@starci/nest-kit"
import type { PairCliOptions } from "./pair.options"

/** The configurable-module base of the pair command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<PairCliOptions>()
