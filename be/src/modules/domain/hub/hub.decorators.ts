import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { HubOptions } from "./hub.options"

/** Injection token of the options of the hub capability. */
export const HUB_OPTIONS: unique symbol = Symbol("domain.hub.options")

/** Injects the options of the hub capability. Parameter type: HubOptions. */
export const InjectHubOptions = (): TypedParameterDecorator<HubOptions> => injector<HubOptions>(HUB_OPTIONS)
