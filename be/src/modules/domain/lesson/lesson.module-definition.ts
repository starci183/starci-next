import { defineCapabilityModule } from "@starci/nest-kit"
import type { LessonOptions } from "./lesson.options"

/** The configurable-module base of the lesson capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<LessonOptions>()
