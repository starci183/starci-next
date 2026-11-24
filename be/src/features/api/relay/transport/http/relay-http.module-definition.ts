import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayHttpOptions } from "./relay-http.options"

/** Defines the relay pairing handshake transport registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<RelayHttpOptions>()
