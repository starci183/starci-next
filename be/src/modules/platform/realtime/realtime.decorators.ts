import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { RealtimeHub } from "./realtime.contracts"

/** Token of the realtime hub port. */
export const REALTIME_HUB: unique symbol = Symbol("platform.realtime.hub")

/** Token of the realtime options. */
export const REALTIME_OPTIONS: unique symbol = Symbol("platform.realtime.options")

/** Injects the realtime hub. Parameter type: RealtimeHub. */
export const InjectRealtimeHub = (): TypedParameterDecorator<RealtimeHub> => injector<RealtimeHub>(REALTIME_HUB)
