import { defineConfigurableModule } from "@starci/nest-kit"
import type { HarnessCiHttpOptions } from "./harness-ci-http.options"

/** Defines the harness-ci webhook module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<HarnessCiHttpOptions>()
