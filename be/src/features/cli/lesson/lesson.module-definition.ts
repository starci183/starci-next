import { defineConfigurableModule } from "@starci/nest-kit"
import type { LessonOptions } from "./lesson.options"

/** The configurable-module base of the lesson command group. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } = defineConfigurableModule<LessonOptions>()
