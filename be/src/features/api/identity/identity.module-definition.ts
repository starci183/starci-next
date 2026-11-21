import { defineConfigurableModule } from "@starci/nest-kit"
import type { IdentityApiOptions } from "./identity.options"

/** The configurable-module base of the identity feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<IdentityApiOptions>()
