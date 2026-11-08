import type { MigrationInterface, QueryRunner } from "typeorm"

/** Adds the topic level: the topic and source folder of each lesson version, and the table of topics with their paths. */
export class AddLessonTopic1795200000000 implements MigrationInterface {
    name = "AddLessonTopic1795200000000"

    /** Adds the columns, fills the versions stored before them from the teacher's topic map, and creates lesson_topics. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE lesson_versions ADD COLUMN topic text, ADD COLUMN source_key text`)
        await queryRunner.query(`UPDATE lesson_versions SET topic = CASE lesson_id
    WHEN 'request-response-lifecycle' THEN 'backend-framework'
    WHEN 'server-state-cache-lifecycle' THEN 'server-state'
    WHEN 'cqrs-read-models' THEN 'communication-patterns'
    WHEN 'unit-testing-behavior' THEN 'testing-strategy'
    WHEN 'health-probe-semantics' THEN 'kubernetes'
    WHEN 'vpc-routing' THEN 'cloud-networking'
    WHEN 'agent-harness-control-loop' THEN 'llm-agents'
    ELSE lesson_group
END`)
        await queryRunner.query(`ALTER TABLE lesson_versions ALTER COLUMN topic SET NOT NULL`)
        await queryRunner.query(`CREATE TABLE lesson_topics (
    topic text PRIMARY KEY,
    title text NOT NULL,
    source_note text NOT NULL,
    description text,
    prerequisites jsonb,
    related jsonb,
    path jsonb NOT NULL,
    ref text NOT NULL,
    imported_at timestamptz NOT NULL
)`)
    }

    /** Drops the topic table and the two columns. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_topics`)
        await queryRunner.query(`ALTER TABLE lesson_versions DROP COLUMN source_key, DROP COLUMN topic`)
    }
}
