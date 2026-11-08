import { defineCapabilityModule } from "@starci/nest-kit"
import { PROBE_OPTIONS } from "./probe.decorators"
import type { ProbeModuleOptions } from "./probe.options"

/** The configurable-module base of the probe transport; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<ProbeModuleOptions>({
    optionsInjectionToken: PROBE_OPTIONS,
})
