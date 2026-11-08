import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Lets a paid purchase be voided by its provider: the purchase keeps its confirmation instant under the new `voided`
 * status, and the audit trail records the Premium time the void took back as a `premium-revoked` event.
 */
export class PurchaseVoids1797700000000 implements MigrationInterface {
    name = "PurchaseVoids1797700000000"

    /** Adds the voided status, keeps the confirmation instant on it, and admits the premium-revoked event kind. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE purchases DROP CONSTRAINT ck_purchases_status`)
        await queryRunner.query(
            `ALTER TABLE purchases ADD CONSTRAINT ck_purchases_status CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'expired', 'voided'))`,
        )
        await queryRunner.query(`ALTER TABLE purchases DROP CONSTRAINT ck_purchases_confirmed`)
        await queryRunner.query(
            `ALTER TABLE purchases ADD CONSTRAINT ck_purchases_confirmed CHECK ((status IN ('paid', 'voided')) = (confirmed_at IS NOT NULL))`,
        )
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_kind`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_kind
    CHECK (kind IN ('paid', 'late-paid', 'canceled', 'expired', 'checkout-refused', 'confirmation-refused', 'payment-voided', 'premium-revoked'))`)
    }

    /** Restores the earlier checks; voided purchases go back to paid and their revoke events are removed first. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM purchase_events WHERE kind = 'premium-revoked'`)
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_kind`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_kind
    CHECK (kind IN ('paid', 'late-paid', 'canceled', 'expired', 'checkout-refused', 'confirmation-refused', 'payment-voided'))`)
        await queryRunner.query(`UPDATE purchases SET status = 'paid' WHERE status = 'voided'`)
        await queryRunner.query(`ALTER TABLE purchases DROP CONSTRAINT ck_purchases_confirmed`)
        await queryRunner.query(
            `ALTER TABLE purchases ADD CONSTRAINT ck_purchases_confirmed CHECK ((status = 'paid') = (confirmed_at IS NOT NULL))`,
        )
        await queryRunner.query(`ALTER TABLE purchases DROP CONSTRAINT ck_purchases_status`)
        await queryRunner.query(
            `ALTER TABLE purchases ADD CONSTRAINT ck_purchases_status CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'expired'))`,
        )
    }
}
