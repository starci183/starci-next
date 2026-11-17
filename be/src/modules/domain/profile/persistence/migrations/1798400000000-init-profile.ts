import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the profile of a learner: the display name and the storage key of the avatar. */
export class InitProfile1798400000000 implements MigrationInterface {
    name = "InitProfile1798400000000"

    /** Creates profile_learners. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE profile_learners (
    learner_id uuid PRIMARY KEY,
    display_name text,
    avatar_key text,
    avatar_content_type text,
    avatar_size integer,
    avatar_updated_at timestamptz,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_profile_learners_name CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 60),
    CONSTRAINT ck_profile_learners_avatar CHECK ((avatar_key IS NULL) = (avatar_content_type IS NULL) AND (avatar_key IS NULL) = (avatar_size IS NULL))
)`)
    }

    /** Drops profile_learners. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE profile_learners`)
    }
}
