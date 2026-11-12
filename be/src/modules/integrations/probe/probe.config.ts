import type { EnvSource } from "@modules/platform/config"
import type { ProbeModuleOptions } from "./probe.options"

/**
 * Reads the probe transport's configuration from an environment source. The transport reaches public addresses only and has no
 * address, secret or tunable of its own (the time and size caps of a probe belong to the project capability that asks), so no key is
 * read and the options are empty; the app root adds `isGlobal`.
 */
export const parseProbeConfig = (_env: EnvSource): ProbeModuleOptions => ({})
