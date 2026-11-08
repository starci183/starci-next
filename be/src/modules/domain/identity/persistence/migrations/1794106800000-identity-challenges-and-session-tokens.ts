import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Replaces the browser-redirect login state with emailed-code challenges and one-use social bundles, and gives sessions
 * a sealed provider refresh token. Existing sessions carry no refresh token, so they end here.
 */
export class IdentityChallengesAndSessionTokens1794106800000 implements MigrationInterface {
    name = "IdentityChallengesAndSessionTokens1794106800000"

    /** Drops the redirect transaction table, rebuilds the session columns and creates the challenge and bundle tables. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE identity_login_transactions`)
        await queryRunner.query(`DELETE FROM identity_sessions`)
        await queryRunner.query(`ALTER TABLE identity_sessions
    DROP COLUMN issuer,
    ADD COLUMN refresh_ciphertext text NOT NULL,
    ADD COLUMN refresh_expires_at timestamptz NOT NULL,
    ADD COLUMN issued_at timestamptz NOT NULL`)
        await queryRunner.query(`CREATE INDEX identity_sessions_subject_idx ON identity_sessions (subject)`)
        await queryRunner.query(`CREATE TABLE identity_challenges (
    challenge_digest varchar(64) PRIMARY KEY,
    purpose varchar(16) NOT NULL CHECK (purpose IN ('sign-in', 'sign-up', 'password-reset')),
    email text NOT NULL,
    locale varchar(2) NOT NULL CHECK (locale IN ('vi', 'en')),
    code_digest varchar(64) NOT NULL,
    attempts_left integer NOT NULL CHECK (attempts_left >= 0),
    deliver boolean NOT NULL,
    payload text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz NULL
)`)
        await queryRunner.query(`CREATE INDEX identity_challenges_expires_idx ON identity_challenges (expires_at)`)
        await queryRunner.query(`CREATE TABLE identity_social_bundles (
    state_digest varchar(64) PRIMARY KEY,
    nonce varchar(43) NOT NULL,
    code_verifier varchar(43) NOT NULL,
    return_to text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz NULL
)`)
        await queryRunner.query(
            `CREATE INDEX identity_social_bundles_expires_idx ON identity_social_bundles (expires_at)`,
        )
    }

    /** Restores the previous structure; sessions and transient state do not come back. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE identity_social_bundles`)
        await queryRunner.query(`DROP TABLE identity_challenges`)
        await queryRunner.query(`DROP INDEX identity_sessions_subject_idx`)
        await queryRunner.query(`DELETE FROM identity_sessions`)
        await queryRunner.query(`ALTER TABLE identity_sessions
    DROP COLUMN issued_at,
    DROP COLUMN refresh_expires_at,
    DROP COLUMN refresh_ciphertext,
    ADD COLUMN issuer text NOT NULL`)
        await queryRunner.query(`CREATE TABLE identity_login_transactions (
    state_digest varchar(64) PRIMARY KEY,
    binding_digest varchar(64) NOT NULL,
    nonce varchar(43) NOT NULL,
    verifier varchar(43) NOT NULL,
    expires_at timestamptz NOT NULL
)`)
    }
}
