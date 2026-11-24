import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayApiOptions } from "./relay.options"

/** Defines the relay handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<RelayApiOptions>()
