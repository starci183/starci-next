import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Lets the audit trail record a verified provider delivery the purchase capability could not apply: a confirmation that
 * names no persisted order (so no purchase row), or one refused for its amount, currency, state or a second payment. Such
 * an event carries the order code, amount, currency and reason the provider reported, so support can reconcile it.
 */
export class PurchaseConfirmationRefusals1796000000000 implements MigrationInterface {
    name = "PurchaseConfirmationRefusals1796000000000"

    /** Adds the reported facts of a refused delivery, the payment-voided kind and the dedup index of refusals. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE purchase_events ALTER COLUMN purchase_id DROP NOT NULL`)
        await queryRunner.query(`ALTER TABLE purchase_events
    ADD COLUMN order_code text,
    ADD COLUMN amount_vnd integer,
    ADD COLUMN currency text,
    ADD COLUMN reason text`)
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_kind`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_kind
    CHECK (kind IN ('paid', 'late-paid', 'canceled', 'expired', 'checkout-refused', 'confirmation-refused', 'payment-voided'))`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_subject
    CHECK (purchase_id IS NOT NULL OR kind IN ('confirmation-refused', 'payment-voided'))`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_reason
    CHECK ((kind IN ('confirmation-refused', 'payment-voided')) = (reason IS NOT NULL))`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_purchase_events_refusal ON purchase_events (rail, provider_ref, kind, reason) WHERE kind IN ('confirmation-refused', 'payment-voided')`,
        )
    }

    /** Drops the refusal facts; refusal rows without a purchase are removed first so the column can be required again. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ux_purchase_events_refusal`)
        await queryRunner.query(`DELETE FROM purchase_events WHERE kind IN ('confirmation-refused', 'payment-voided')`)
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_reason`)
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_subject`)
        await queryRunner.query(`ALTER TABLE purchase_events DROP CONSTRAINT ck_purchase_events_kind`)
        await queryRunner.query(`ALTER TABLE purchase_events ADD CONSTRAINT ck_purchase_events_kind
    CHECK (kind IN ('paid', 'late-paid', 'canceled', 'expired', 'checkout-refused', 'confirmation-refused'))`)
        await queryRunner.query(`ALTER TABLE purchase_events
    DROP COLUMN reason,
    DROP COLUMN currency,
    DROP COLUMN amount_vnd,
    DROP COLUMN order_code`)
        await queryRunner.query(`ALTER TABLE purchase_events ALTER COLUMN purchase_id SET NOT NULL`)
    }
}
