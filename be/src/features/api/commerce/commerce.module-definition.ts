import { defineConfigurableModule } from "@starci/nest-kit"
import type { CommerceOptions } from "./commerce.options"

/** Defines the handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<CommerceOptions>()
