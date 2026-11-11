import { defineCapabilityModule } from "@starci/nest-kit"
import { RELAY_CLIENT_OPTIONS } from "./relay-client.decorators"
import type { RelayClientModuleOptions } from "./relay-client.options"

/** The configurable-module base of the relay client integration; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<RelayClientModuleOptions>({
    optionsInjectionToken: RELAY_CLIENT_OPTIONS,
})
