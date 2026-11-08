import type { DynamicModule } from "@nestjs/common"
import {
    ENTITLEMENT_ERROR_KINDS,
    ENTITLEMENT_MESSAGES,
    EntitlementModule,
    entitlementEntities,
    entitlementMigrations,
} from "@modules/domain/entitlement"
import {
    PURCHASE_ERROR_KINDS,
    PURCHASE_MESSAGES,
    PurchaseModule,
    purchaseEntities,
    purchaseMigrations,
} from "@modules/domain/purchase"
import { PAYOS_ERROR_KINDS, PAYOS_MESSAGES, PayosModule } from "@modules/integrations/payos"
import { SEPAY_ERROR_KINDS, SEPAY_MESSAGES, SepayModule } from "@modules/integrations/sepay"
import type { DatabaseConnectionOptions } from "@modules/platform/database"
import type { ErrorKind } from "@modules/platform/errors"
import type { MessageBundle } from "@modules/platform/i18n"
import type { CoreOptions } from "../core.options"

/**
 * The commerce area: Premium entitlements, purchases and the two payment rails. A `null` channel still composes the rail: every
 * call refuses instead of trusting a channel nobody named.
 */
export const commerceModules = (options: CoreOptions): Array<DynamicModule> => [
    EntitlementModule.register({ isGlobal: true }),
    PurchaseModule.register({ isGlobal: true, ...options.purchase }),
    SepayModule.register({ isGlobal: true, channel: options.sepay }),
    PayosModule.register({ isGlobal: true, channel: options.payos }),
]

/** The error kind tables of the commerce area. */
export const commerceAreaErrorKinds: ReadonlyArray<Readonly<Record<string, ErrorKind>>> = [
    ENTITLEMENT_ERROR_KINDS,
    PURCHASE_ERROR_KINDS,
    SEPAY_ERROR_KINDS,
    PAYOS_ERROR_KINDS,
]

/** The message bundles of the commerce area. */
export const commerceAreaMessages: ReadonlyArray<MessageBundle> = [
    ENTITLEMENT_MESSAGES,
    PURCHASE_MESSAGES,
    SEPAY_MESSAGES,
    PAYOS_MESSAGES,
]

/** The entities the commerce area keeps in the primary database. */
export const commerceAreaEntities: DatabaseConnectionOptions["entities"] = [...entitlementEntities, ...purchaseEntities]

/** The migrations of the commerce area. */
export const commerceAreaMigrations: DatabaseConnectionOptions["migrations"] = [
    ...entitlementMigrations,
    ...purchaseMigrations,
]
