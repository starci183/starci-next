import { defineConfigurableModule } from "@starci/nest-kit"
import type { LabCliOptions } from "./lab.options"

/** The configurable-module base of the lab command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<LabCliOptions>()
