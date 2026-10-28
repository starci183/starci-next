import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { PayosModuleOptions } from "./payos.options"

/** Injection token of the validated payOS module options. */
export const PAYOS_OPTIONS: unique symbol = Symbol("integrations.payos.options")

/** Injects the validated payOS module options. Parameter type: PayosModuleOptions. */
export const InjectPayosOptions = (): TypedParameterDecorator<PayosModuleOptions> =>
    injector<PayosModuleOptions>(PAYOS_OPTIONS)
