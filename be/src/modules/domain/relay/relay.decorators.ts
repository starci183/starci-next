import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { RelayOptions } from "./relay.options"

/** Token of the relay-owned options. */
export const RELAY_OPTIONS: unique symbol = Symbol("domain.relay.options")

/** Injects the validated relay options. Parameter type: RelayOptions. */
export const InjectRelayOptions = (): TypedParameterDecorator<RelayOptions> => injector<RelayOptions>(RELAY_OPTIONS)
