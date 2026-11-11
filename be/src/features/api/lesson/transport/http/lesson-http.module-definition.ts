import { ConfigurableModuleBuilder, type ConfigurableModuleHost } from "@nestjs/common"
import type { LessonHttpOptions } from "./lesson-http.options"

const built = new ConfigurableModuleBuilder<LessonHttpOptions>().setClassMethodName("register").build()
type Host = ConfigurableModuleHost<LessonHttpOptions, "register", "create", {}>
/** Defines the static lesson HTTP transport registration. */
export const ConfigurableModuleClass: Host["ConfigurableModuleClass"] = built.ConfigurableModuleClass
