import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the table of immutable lesson versions, with at most one live version per lesson. */
export class InitLesson1795000000000 implements MigrationInterface {
    name = "InitLesson1795000000000"

    /** Creates lesson_versions and the partial unique index that keeps one published version per lesson. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_versions (
    lesson_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status varchar(16) NOT NULL,
    category text NOT NULL,
    difficulty varchar(16) NOT NULL,
    minutes_read integer NOT NULL,
    implementation text NOT NULL,
    sort_index integer NOT NULL,
    titles jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    source_hashes jsonb NOT NULL,
    content jsonb NOT NULL,
    imported_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_versions PRIMARY KEY (lesson_id, version),
    CONSTRAINT ck_lesson_versions_status CHECK (status IN ('published', 'superseded')),
    CONSTRAINT ck_lesson_versions_difficulty CHECK (difficulty IN ('foundation', 'intermediate', 'advanced')),
    CONSTRAINT ck_lesson_versions_minutes CHECK (minutes_read > 0)
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_lesson_versions_published ON lesson_versions (lesson_id) WHERE status = 'published'`,
        )
    }

    /** Drops the lesson table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_versions`)
    }
}
