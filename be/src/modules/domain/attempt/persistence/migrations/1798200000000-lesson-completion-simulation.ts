import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * The 6-step lesson redesign (owner go-ahead, 2026-11-11): a lesson ends. `lesson_completions` keeps, once per learner and
 * lesson, the instant every required activity was graded (the instant the 1, 7 and 21 day reviews open from); and
 * `lesson_simulation_progress` keeps where a learner stands in a simulation (the branches tried and the current state) so a
 * reload keeps it.
 */
export class LessonCompletionSimulation1798200000000 implements MigrationInterface {
    name = "LessonCompletionSimulation1798200000000"

    /** Creates lesson_completions and lesson_simulation_progress. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_completions (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    lesson_version text NOT NULL,
    completed_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_completions PRIMARY KEY (learner_id, lesson_id)
)`)
        await queryRunner.query(`CREATE TABLE lesson_simulation_progress (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    activity_id text NOT NULL,
    lesson_version text NOT NULL,
    current_state_id text NOT NULL,
    action_ids text[] NOT NULL,
    tried_transition_ids text[] NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_simulation_progress PRIMARY KEY (learner_id, lesson_id, activity_id)
)`)
    }

    /** Drops both tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_simulation_progress`)
        await queryRunner.query(`DROP TABLE lesson_completions`)
    }
}
