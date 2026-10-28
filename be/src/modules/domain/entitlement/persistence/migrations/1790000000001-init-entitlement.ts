import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the one-row-per-learner Premium entitlement table. */
export class InitEntitlement1790000000001 implements MigrationInterface {
    name = "InitEntitlement1790000000001"

    /** Creates entitlements with explicit UTC instants. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE entitlements (
    learner_id uuid PRIMARY KEY,
    premium_until timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_entitlements_premium_until CHECK (premium_until > '-infinity'::timestamptz)
)`)
    }

    /** Drops the entitlement table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE entitlements`)
    }
}
