import { defineCapabilityModule } from "@starci/nest-kit"
import { CONTENT_OPTIONS } from "./content.decorators"
import type { ContentOptions } from "./content.options"

/** The configurable-module base of the content capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ContentOptions>({
    optionsInjectionToken: CONTENT_OPTIONS,
})
