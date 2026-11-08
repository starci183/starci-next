import { defineConfigurableModule } from "@starci/nest-kit"
import type { ReviewApiOptions } from "./review.options"

/** The configurable-module base of the review feature module. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<ReviewApiOptions>()
