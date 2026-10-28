import { EntitlementEntity } from "./entities/entitlement.entity"
import { InitEntitlement1790000000001 } from "./migrations/1790000000001-init-entitlement"

/** The entities of the entitlement capability. */
export const entitlementEntities = [EntitlementEntity]

/** The migrations of the entitlement capability, in the order they run. */
export const entitlementMigrations = [InitEntitlement1790000000001]
