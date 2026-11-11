import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayCliOptions } from "./relay-cli.options"

/** The configurable-module base of the relay-cli command root. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<RelayCliOptions>()
