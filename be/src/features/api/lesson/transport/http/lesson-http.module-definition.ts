import { defineConfigurableModule } from "@starci/nest-kit"
import type { LessonHttpOptions } from "./lesson-http.options"

/** Defines the static lesson HTTP transport registration. */
export const { ConfigurableModuleClass } = defineConfigurableModule<LessonHttpOptions>()
