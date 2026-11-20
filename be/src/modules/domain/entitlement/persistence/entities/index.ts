import { EntitlementEntity } from "./entitlement.entity"

export { EntitlementEntity }

/** The entities of the entitlement capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const entitlementEntities: ReadonlyArray<new () => object> = [EntitlementEntity]
