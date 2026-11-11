import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * The proved level of a concept needs the mutation score of its incident run (owner ruling 2026-11-08, decided under delegation
 * 2026-11-10): one row per learner and lesson keeps the best score. Nothing writes it until incident runs report a score, so
 * no outcome is proved before then.
 */
export class IncidentMutationScore1798100000000 implements MigrationInterface {
    name = "IncidentMutationScore1798100000000"

    /** Creates lesson_incident_scores. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_incident_scores (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    mutation_score smallint NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_incident_scores PRIMARY KEY (learner_id, lesson_id),
    CONSTRAINT ck_lesson_incident_scores_score CHECK (mutation_score BETWEEN 0 AND 100)
)`)
    }

    /** Drops lesson_incident_scores. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_incident_scores`)
    }
}
