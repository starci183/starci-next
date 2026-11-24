import { defineConfigurableModule } from "@starci/nest-kit"
import type { CourseGraphqlOptions } from "./course-graphql.options"

/** Defines the course GraphQL transport registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<CourseGraphqlOptions>()
