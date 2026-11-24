import { defineConfigurableModule } from "@starci/nest-kit"
import type { PayosHttpOptions } from "./payos-http.options"

/** Defines the payos webhook module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<PayosHttpOptions>()
