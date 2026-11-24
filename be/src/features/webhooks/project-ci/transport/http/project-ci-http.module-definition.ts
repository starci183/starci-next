import { defineConfigurableModule } from "@starci/nest-kit"
import type { ProjectCiHttpOptions } from "./project-ci-http.options"

/** Defines the project-ci webhook module registration without owning capability state. */
export const { ConfigurableModuleClass } = defineConfigurableModule<ProjectCiHttpOptions>()
