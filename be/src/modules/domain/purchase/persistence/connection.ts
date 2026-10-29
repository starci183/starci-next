import { PurchaseEntity } from "./entities/purchase.entity"
import { PurchaseEventEntity } from "./entities/purchase-event.entity"
import { InitPurchase1790000000002 } from "./migrations/1790000000002-init-purchase"

/** The entities of the purchase capability. */
export const purchaseEntities = [PurchaseEntity, PurchaseEventEntity]

/** The migrations of the purchase capability, in the order they run. */
export const purchaseMigrations = [InitPurchase1790000000002]
