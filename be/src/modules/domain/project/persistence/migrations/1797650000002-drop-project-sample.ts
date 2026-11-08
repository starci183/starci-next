import type { MigrationInterface, QueryRunner } from "typeorm"

/** Drops the sample a project started from: learners bring their own projects and there is no sample project any more. */
export class DropProjectSample1797650000002 implements MigrationInterface {
    name = "DropProjectSample1797650000002"

    /** Drops projects.sample_id. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE projects DROP COLUMN sample_id`)
    }

    /** Adds the column back, empty. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE projects ADD COLUMN sample_id text`)
    }
}
