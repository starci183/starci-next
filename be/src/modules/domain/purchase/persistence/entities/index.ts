import { PurchaseEntity } from "./purchase.entity"
import { PurchaseEventEntity } from "./purchase-event.entity"

export { PurchaseEntity, PurchaseEventEntity }

/** The entities of the purchase capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const purchaseEntities: ReadonlyArray<new () => object> = [PurchaseEntity, PurchaseEventEntity]
