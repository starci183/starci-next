import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { SepayClient } from "./sepay.client"
import type { SepayModuleOptions } from "./sepay.options"

/** Injection token of the Sepay rail client. */
export const SEPAY_CLIENT: unique symbol = Symbol("integrations.sepay.client")

/** Injection token of the validated Sepay module options. */
export const SEPAY_OPTIONS: unique symbol = Symbol("integrations.sepay.options")

/** Injects the Sepay rail client. Parameter type: SepayClient. */
export const InjectSepayClient = (): TypedParameterDecorator<SepayClient> => injector<SepayClient>(SEPAY_CLIENT)

/** Injects the validated Sepay module options. Parameter type: SepayModuleOptions. */
export const InjectSepayOptions = (): TypedParameterDecorator<SepayModuleOptions> =>
    injector<SepayModuleOptions>(SEPAY_OPTIONS)
