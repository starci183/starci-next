import { defineCapabilityModule } from "@starci/nest-kit"
import type { NotificationOptions } from "./notification.options"

/** The configurable-module base of the notification capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<NotificationOptions>()
