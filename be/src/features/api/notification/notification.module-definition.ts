import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { NotificationApiOptions } from "./notification.options"

const built = new ConfigurableModuleBuilder<NotificationApiOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<NotificationApiOptions, "register", "create", {}>
/** Defines the handler module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
