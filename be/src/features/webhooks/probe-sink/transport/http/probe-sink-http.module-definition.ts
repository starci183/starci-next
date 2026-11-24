import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProbeSinkHttpOptions } from "./probe-sink-http.options"

/** Defines the probe-sink webhook module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<ProbeSinkHttpOptions>()
