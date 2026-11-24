import { defineConfigurableModule } from "@starci/nest-kit"
import type { RelayFeedApiOptions } from "./relay-feed.options"

/** Defines the relay feed handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<RelayFeedApiOptions>()
