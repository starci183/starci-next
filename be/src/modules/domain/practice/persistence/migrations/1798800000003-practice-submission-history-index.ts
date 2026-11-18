import type { MigrationInterface, QueryRunner } from "typeorm"

/** Adds the access path of the learner history: the graded submits of one learner, newest first. */
export class PracticeSubmissionHistoryIndex1798800000003 implements MigrationInterface {
    name = "PracticeSubmissionHistoryIndex1798800000003"

    /** Creates ix_practice_submissions_history over the submits of a learner by instant and id, newest first. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX ix_practice_submissions_history ON practice_submissions (learner_id, created_at DESC, submission_id DESC) INCLUDE (problem_id) WHERE kind = 'submit'`,
        )
    }

    /** Drops what up added. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ix_practice_submissions_history`)
    }
}
