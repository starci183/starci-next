import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the lesson attempts, one row per learner, activity and revision, and the outcome levels they raise. */
export class InitAttempt1795000000100 implements MigrationInterface {
    name = "InitAttempt1795000000100"

    /** Creates lesson_attempts with its idempotency key and lesson_outcome_levels. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE lesson_attempts (
    attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    lesson_version text NOT NULL,
    activity_id text NOT NULL,
    revision integer NOT NULL,
    kind varchar(16) NOT NULL,
    phase varchar(16) NOT NULL,
    locale varchar(8) NOT NULL,
    is_diagnostic boolean NOT NULL,
    answer jsonb NOT NULL,
    status varchar(16) NOT NULL,
    result jsonb,
    failure_code varchar(64),
    submitted_at timestamptz NOT NULL,
    graded_at timestamptz,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_lesson_attempts_revision CHECK (revision >= 1),
    CONSTRAINT ck_lesson_attempts_kind CHECK (kind IN ('choice', 'simulation', 'explain', 'exercise')),
    CONSTRAINT ck_lesson_attempts_phase CHECK (phase IN ('challenge', 'predict', 'explore', 'explain', 'apply', 'reflect')),
    CONSTRAINT ck_lesson_attempts_locale CHECK (locale IN ('vi', 'en')),
    CONSTRAINT ck_lesson_attempts_status CHECK (status IN ('saved', 'grading', 'graded', 'failed')),
    CONSTRAINT ck_lesson_attempts_result CHECK ((status = 'graded') = (result IS NOT NULL)),
    CONSTRAINT ck_lesson_attempts_graded_at CHECK ((status = 'graded') = (graded_at IS NOT NULL)),
    CONSTRAINT ck_lesson_attempts_failure CHECK ((status = 'failed') = (failure_code IS NOT NULL))
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_lesson_attempts_revision ON lesson_attempts (learner_id, lesson_id, lesson_version, activity_id, revision)`,
        )
        await queryRunner.query(`CREATE TABLE lesson_outcome_levels (
    learner_id uuid NOT NULL,
    lesson_id text NOT NULL,
    outcome_id text NOT NULL,
    understood smallint NOT NULL,
    proved smallint NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_lesson_outcome_levels PRIMARY KEY (learner_id, lesson_id, outcome_id),
    CONSTRAINT ck_lesson_outcome_levels_understood CHECK (understood BETWEEN 0 AND 2),
    CONSTRAINT ck_lesson_outcome_levels_proved CHECK (proved BETWEEN 0 AND 2)
)`)
    }

    /** Drops the attempt tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE lesson_outcome_levels`)
        await queryRunner.query(`DROP TABLE lesson_attempts`)
    }
}
