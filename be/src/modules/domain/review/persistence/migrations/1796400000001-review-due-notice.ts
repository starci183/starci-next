import type { MigrationInterface, QueryRunner } from "typeorm"

/** Remembers the day a learner was told their review cards are due, so the notice goes out once a day. */
export class ReviewDueNotice1796400000001 implements MigrationInterface {
    name = "ReviewDueNotice1796400000001"

    /** Adds the day of the last due notice to the review settings. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE review_settings ADD COLUMN due_notified_on date`)
    }

    /** Drops the column. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE review_settings DROP COLUMN due_notified_on`)
    }
}
