import { defineCapabilityModule } from "@starci/nest-kit"
import { RELAY_OPTIONS } from "./relay.decorators"
import type { RelayOptions } from "./relay.options"

/** The configurable-module base of the relay capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<RelayOptions>({
    optionsInjectionToken: RELAY_OPTIONS,
})
