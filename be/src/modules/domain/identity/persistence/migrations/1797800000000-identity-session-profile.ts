import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Gives a session the learner's display name and email from the verified provider token, so the front end can show who is
 * signed in. Both are nullable: sessions that exist now stay as they are and read as null until the learner signs in again.
 */
export class IdentitySessionProfile1797800000000 implements MigrationInterface {
    name = "IdentitySessionProfile1797800000000"

    /** Adds the two profile columns with their length bounds. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE identity_sessions
    ADD COLUMN display_name text NULL,
    ADD COLUMN email text NULL,
    ADD CONSTRAINT ck_identity_sessions_display_name CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 120),
    ADD CONSTRAINT ck_identity_sessions_email CHECK (email IS NULL OR char_length(email) BETWEEN 3 AND 254)`)
    }

    /** Drops the profile columns with their bounds. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE identity_sessions
    DROP CONSTRAINT ck_identity_sessions_email,
    DROP CONSTRAINT ck_identity_sessions_display_name,
    DROP COLUMN email,
    DROP COLUMN display_name`)
    }
}
