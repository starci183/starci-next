import { defineConfigurableModule } from "@starci/nest-kit"
import type { CourseApiOptions } from "./course.options"

/** Defines the course handler module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<CourseApiOptions>()
