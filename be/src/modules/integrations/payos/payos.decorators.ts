import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { PayosClient } from "./payos.client"
import type { PayosModuleOptions } from "./payos.options"

/** Injection token of the Payos rail client. */
export const PAYOS_CLIENT: unique symbol = Symbol("integrations.payos.client")

/** Injection token of the validated Payos module options. */
export const PAYOS_OPTIONS: unique symbol = Symbol("integrations.payos.options")

/** Injects the Payos rail client. Parameter type: PayosClient. */
export const InjectPayosClient = (): TypedParameterDecorator<PayosClient> => injector<PayosClient>(PAYOS_CLIENT)

/** Injects the validated Payos module options. Parameter type: PayosModuleOptions. */
export const InjectPayosOptions = (): TypedParameterDecorator<PayosModuleOptions> =>
    injector<PayosModuleOptions>(PAYOS_OPTIONS)
