import { defineCapabilityModule } from "@starci/nest-kit"
import { HUB_OPTIONS } from "./hub.decorators"
import type { HubOptions } from "./hub.options"

/** The configurable-module base of the hub capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<HubOptions>({
    optionsInjectionToken: HUB_OPTIONS,
})
