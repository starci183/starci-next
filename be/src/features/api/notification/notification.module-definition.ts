import { defineConfigurableModule } from "@starci/nest-kit"
import type { NotificationApiOptions } from "./notification.options"

/** Defines the handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<NotificationApiOptions>()
