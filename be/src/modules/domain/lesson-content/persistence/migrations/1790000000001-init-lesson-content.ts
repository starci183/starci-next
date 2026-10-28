import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the lesson-content tables of the primary database. */
export class InitLessonContent1790000000001 implements MigrationInterface {
    name = "InitLessonContent1790000000001"

    /** Creates the immutable versions table and its separate server-only grading table. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_content_versions (
    content_id text NOT NULL,
    version text NOT NULL,
    source_hash text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (content_id, version)
)`)
        await queryRunner.query(`CREATE TABLE lesson_content_grading (
    content_id text NOT NULL,
    version text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (content_id, version),
    FOREIGN KEY (content_id, version) REFERENCES lesson_content_versions (content_id, version)
)`)
    }

    /** Drops the grading table and the versions table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_content_grading`)
        await queryRunner.query(`DROP TABLE lesson_content_versions`)
    }
}
