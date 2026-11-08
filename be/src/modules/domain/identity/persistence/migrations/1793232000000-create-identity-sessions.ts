import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates identity-owned login state and opaque application session authority. */
export class CreateIdentitySessions1793232000000 implements MigrationInterface {
    name = "CreateIdentitySessions1793232000000"

    /** Creates one-use browser transactions and digest-only sessions. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE identity_login_transactions (
    state_digest varchar(64) PRIMARY KEY,
    binding_digest varchar(64) NOT NULL,
    nonce varchar(43) NOT NULL,
    verifier varchar(43) NOT NULL,
    expires_at timestamptz NOT NULL
)`)
        await queryRunner.query(`CREATE TABLE identity_sessions (
    reference_digest varchar(64) PRIMARY KEY,
    issuer text NOT NULL,
    subject text NOT NULL,
    roles jsonb NOT NULL CHECK (jsonb_typeof(roles) = 'array'),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz NULL
)`)
    }

    /** Drops session authority before the independent transient login state. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE identity_sessions`)
        await queryRunner.query(`DROP TABLE identity_login_transactions`)
    }
}
