import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { SepayClient } from "./sepay.client"

/** Injection token of the SePay rail client. */
export const SEPAY_CLIENT: unique symbol = Symbol("integrations.sepay.client")

/** Injects the SePay rail client. Parameter type: SepayClient. */
export const InjectSepayClient = (): TypedParameterDecorator<SepayClient> => injector<SepayClient>(SEPAY_CLIENT)
