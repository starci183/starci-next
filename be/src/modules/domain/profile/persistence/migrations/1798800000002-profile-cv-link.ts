import type { MigrationInterface, QueryRunner } from "typeorm"

/** Gives a learner a CV link: a unique slug, whether the CV is public and the account name shown when no display name is set. */
export class ProfileCvLink1798800000002 implements MigrationInterface {
    name = "ProfileCvLink1798800000002"

    /** Adds cv_slug, cv_public and account_name to profile_learners. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE profile_learners
    ADD COLUMN cv_slug text,
    ADD COLUMN cv_public boolean NOT NULL DEFAULT false,
    ADD COLUMN account_name text,
    ADD CONSTRAINT ck_profile_learners_cv_slug CHECK (cv_slug IS NULL OR cv_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_profile_learners_cv_slug ON profile_learners (cv_slug) WHERE cv_slug IS NOT NULL`,
        )
    }

    /** Drops what up added. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ux_profile_learners_cv_slug`)
        await queryRunner.query(`ALTER TABLE profile_learners
    DROP CONSTRAINT ck_profile_learners_cv_slug,
    DROP COLUMN account_name,
    DROP COLUMN cv_public,
    DROP COLUMN cv_slug`)
    }
}
