import { injector } from "@modules/platform/composition"
import type { TypedParameterDecorator } from "@modules/platform/composition"
import type { EntitlementService } from "./entitlement.service"

/** Token of the entitlement service for other capabilities. */
export const ENTITLEMENT_SERVICE: unique symbol = Symbol("domain.entitlement.service")

/** Injects the entitlement service. Parameter type: EntitlementService. */
export const InjectEntitlementService = (): TypedParameterDecorator<EntitlementService> =>
    injector<EntitlementService>(ENTITLEMENT_SERVICE)
