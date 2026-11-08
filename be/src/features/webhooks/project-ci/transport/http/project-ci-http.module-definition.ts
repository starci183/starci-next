import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { ProjectCiHttpOptions } from "./project-ci-http.options"

const built = new ConfigurableModuleBuilder<ProjectCiHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<ProjectCiHttpOptions, "register", "create", {}>
/** Defines the project-ci webhook module registration without owning capability state. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
