import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { PayosClient } from "./payos.client"

/** Injection token of the payOS rail client. */
export const PAYOS_CLIENT: unique symbol = Symbol("integrations.payos.client")

/** Injects the payOS rail client. Parameter type: PayosClient. */
export const InjectPayosClient = (): TypedParameterDecorator<PayosClient> => injector<PayosClient>(PAYOS_CLIENT)
