import { defineConfigurableModule } from "@starci/nest-kit"
import type { SepayHttpOptions } from "./sepay-http.options"

/** Defines the sepay webhook module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<SepayHttpOptions>()
