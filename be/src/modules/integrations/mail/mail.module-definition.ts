import { defineCapabilityModule } from "@starci/nest-kit"
import type { MailOptions } from "./mail.options"

/** The configurable-module base of the mail glue; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<MailOptions>()
