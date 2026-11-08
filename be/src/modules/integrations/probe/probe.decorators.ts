import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ProbeModuleOptions } from "./probe.options"

/** Injection token of the probe transport options. */
export const PROBE_OPTIONS: unique symbol = Symbol("integrations.probe.options")

/** Injects the probe transport options. Parameter type: ProbeModuleOptions. */
export const InjectProbeOptions = (): TypedParameterDecorator<ProbeModuleOptions> =>
    injector<ProbeModuleOptions>(PROBE_OPTIONS)
