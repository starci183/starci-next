import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { EntitlementOptions } from "./entitlement.options"
import type { EntitlementService } from "./entitlement.service"

/** Token of the entitlement service for other capabilities. */
export const ENTITLEMENT_SERVICE: unique symbol = Symbol("domain.entitlement.service")

/** Injection token of the options of the entitlement capability. */
export const ENTITLEMENT_OPTIONS: unique symbol = Symbol("domain.entitlement.options")

/** Injects the options of the entitlement capability. Parameter type: EntitlementOptions. */
export const InjectEntitlementOptions = (): TypedParameterDecorator<EntitlementOptions> =>
    injector<EntitlementOptions>(ENTITLEMENT_OPTIONS)

/** Injects the entitlement service. Parameter type: EntitlementService. */
export const InjectEntitlementService = (): TypedParameterDecorator<EntitlementService> =>
    injector<EntitlementService>(ENTITLEMENT_SERVICE)
