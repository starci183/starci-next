import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Two small learner marks of the four-part lesson: `lesson_hint_uses` keeps the scenario hints a learner asked for (the lesson then
 * reads "có hỗ trợ"), and `lesson_section_reads` keeps the article sections they marked as read (which clears "nên đọc kỹ").
 */
export class LessonHintSectionMarks1798300000000 implements MigrationInterface {
    name = "LessonHintSectionMarks1798300000000"

    /** Creates lesson_hint_uses and lesson_section_reads. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_hint_uses (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    scenario_id text NOT NULL,
    used_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_hint_uses PRIMARY KEY (learner_id, lesson_id, scenario_id)
)`)
        await queryRunner.query(`CREATE TABLE lesson_section_reads (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    section_id text NOT NULL,
    read_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_section_reads PRIMARY KEY (learner_id, lesson_id, section_id)
)`)
    }

    /** Drops both tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_section_reads`)
        await queryRunner.query(`DROP TABLE lesson_hint_uses`)
    }
}
