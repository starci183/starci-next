import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProfileApiOptions } from "./profile.options"

/** The configurable-module base of the profile feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ProfileApiOptions>()
