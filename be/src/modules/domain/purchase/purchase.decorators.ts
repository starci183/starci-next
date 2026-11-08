import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PurchaseOptions } from "./purchase.options"

/** Token of the purchase-owned options. */
export const PURCHASE_OPTIONS: unique symbol = Symbol("domain.purchase.options")

/** Injects the validated purchase options. Parameter type: PurchaseOptions. */
export const InjectPurchaseOptions = (): TypedParameterDecorator<PurchaseOptions> =>
    injector<PurchaseOptions>(PURCHASE_OPTIONS)
