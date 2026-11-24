import { defineCapabilityModule } from "@starci/nest-kit"
import type { CourseOptions } from "./course.options"

/** The configurable-module base of the course capability; `isGlobal` is decided by the app root. */
export const { ConfigurableModuleClass, OPTIONS_TYPE } = defineCapabilityModule<CourseOptions>()
