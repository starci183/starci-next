import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates relay_devices: one row per paired learner machine, its codes and its token kept only as digests. */
export class InitRelay1797700000002 implements MigrationInterface {
    name = "InitRelay1797700000002"

    /** Creates the device table with its lookups by device code, user code and token. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE relay_devices (
    device_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid,
    name text NOT NULL,
    platform text NOT NULL,
    device_code_digest varchar(64) NOT NULL,
    user_code varchar(9) NOT NULL,
    status text NOT NULL,
    token_digest varchar(64),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    confirmed_at timestamptz,
    last_seen_at timestamptz,
    revoked_at timestamptz,
    CONSTRAINT ck_relay_devices_status CHECK (status IN ('pending', 'confirmed', 'active', 'revoked')),
    CONSTRAINT ck_relay_devices_platform CHECK (platform IN ('windows', 'macos', 'linux')),
    CONSTRAINT ck_relay_devices_learner CHECK ((status = 'pending') = (learner_id IS NULL)),
    CONSTRAINT ck_relay_devices_token CHECK ((status = 'active') = (token_digest IS NOT NULL))
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_relay_devices_device_code ON relay_devices (device_code_digest)`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_relay_devices_pending_user_code ON relay_devices (user_code) WHERE status = 'pending'`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_relay_devices_token ON relay_devices (token_digest) WHERE token_digest IS NOT NULL`,
        )
        await queryRunner.query(
            `CREATE INDEX ix_relay_devices_learner ON relay_devices (learner_id, confirmed_at DESC)`,
        )
    }

    /** Drops the device table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE relay_devices`)
    }
}
