import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { SepayModuleOptions } from "./sepay.options"

/** Injection token of the validated SePay module options. */
export const SEPAY_OPTIONS: unique symbol = Symbol("integrations.sepay.options")

/** Injects the validated SePay module options. Parameter type: SepayModuleOptions. */
export const InjectSepayOptions = (): TypedParameterDecorator<SepayModuleOptions> =>
    injector<SepayModuleOptions>(SEPAY_OPTIONS)
