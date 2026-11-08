import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the purchase tables: one row per purchase attempt and its append-only audit events. */
export class InitPurchase1790000000002 implements MigrationInterface {
    name = "InitPurchase1790000000002"

    /** Creates purchases with their idempotency identity and purchase_events for audit. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SEQUENCE purchase_order_codes START 1`)
        await queryRunner.query(`CREATE TABLE purchases (
    purchase_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    plan text NOT NULL,
    amount_vnd integer NOT NULL,
    currency text NOT NULL,
    rail text NOT NULL,
    order_code text NOT NULL,
    provider_ref text,
    status text NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    confirmed_at timestamptz,
    CONSTRAINT ck_purchases_amount CHECK (amount_vnd > 0),
    CONSTRAINT ck_purchases_currency CHECK (currency = 'VND'),
    CONSTRAINT ck_purchases_status CHECK (status IN ('pending', 'paid', 'failed', 'canceled', 'expired')),
    CONSTRAINT ck_purchases_confirmed CHECK ((status = 'paid') = (confirmed_at IS NOT NULL))
)`)
        await queryRunner.query(`CREATE UNIQUE INDEX ux_purchases_rail_order ON purchases (rail, order_code)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_purchases_rail_provider_ref ON purchases (rail, provider_ref) WHERE provider_ref IS NOT NULL`,
        )
        await queryRunner.query(`CREATE INDEX ix_purchases_learner ON purchases (learner_id, created_at DESC)`)
        await queryRunner.query(`CREATE TABLE purchase_events (
    event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id uuid NOT NULL REFERENCES purchases (purchase_id),
    kind text NOT NULL,
    rail text NOT NULL,
    provider_ref text,
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_purchase_events_kind CHECK (kind IN ('paid', 'late-paid', 'canceled', 'expired', 'checkout-refused', 'confirmation-refused'))
)`)
        await queryRunner.query(`CREATE INDEX ix_purchase_events_purchase ON purchase_events (purchase_id, created_at)`)
    }

    /** Drops the purchase tables and the order-code sequence. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE purchase_events`)
        await queryRunner.query(`DROP TABLE purchases`)
        await queryRunner.query(`DROP SEQUENCE purchase_order_codes`)
    }
}
