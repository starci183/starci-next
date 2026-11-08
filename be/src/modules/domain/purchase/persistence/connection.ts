import { PurchaseEntity } from "./entities/purchase.entity"
import { PurchaseEventEntity } from "./entities/purchase-event.entity"
import { InitPurchase1790000000002 } from "./migrations/1790000000002-init-purchase"
import { PurchaseConfirmationRefusals1796000000000 } from "./migrations/1796000000000-purchase-confirmation-refusals"
import { PurchaseVoids1797700000000 } from "./migrations/1797700000000-purchase-voids"

/** The entities of the purchase capability. */
export const purchaseEntities: Array<typeof PurchaseEntity | typeof PurchaseEventEntity> = [
    PurchaseEntity,
    PurchaseEventEntity,
]

/** The migrations of the purchase capability, in the order they run. */
export const purchaseMigrations: Array<
    | typeof InitPurchase1790000000002
    | typeof PurchaseConfirmationRefusals1796000000000
    | typeof PurchaseVoids1797700000000
> = [InitPurchase1790000000002, PurchaseConfirmationRefusals1796000000000, PurchaseVoids1797700000000]
