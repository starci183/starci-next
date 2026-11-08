import type { MigrationInterface, QueryRunner } from "typeorm"

/** Adds the catalog group to every lesson version and fills the versions stored before it existed. */
export class AddLessonGroup1795100000000 implements MigrationInterface {
    name = "AddLessonGroup1795100000000"

    /** Adds lesson_group, backfills it from the lesson map and the category fallback, then makes it required. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE lesson_versions ADD COLUMN lesson_group text`)
        await queryRunner.query(`UPDATE lesson_versions SET lesson_group = CASE lesson_id
    WHEN 'request-response-lifecycle' THEN 'backend'
    WHEN 'server-state-cache-lifecycle' THEN 'frontend'
    WHEN 'cqrs-read-models' THEN 'distributed'
    WHEN 'unit-testing-behavior' THEN 'testing'
    WHEN 'health-probe-semantics' THEN 'infra'
    WHEN 'vpc-routing' THEN 'cloud'
    WHEN 'agent-harness-control-loop' THEN 'ai'
    ELSE CASE category WHEN 'ai-harness' THEN 'ai' ELSE category END
END`)
        await queryRunner.query(`ALTER TABLE lesson_versions ALTER COLUMN lesson_group SET NOT NULL`)
    }

    /** Drops the group column. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE lesson_versions DROP COLUMN lesson_group`)
    }
}
