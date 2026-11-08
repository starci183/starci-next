import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProjectApiOptions } from "./project.options"

/** The configurable-module base of the project feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProjectApiOptions>()
