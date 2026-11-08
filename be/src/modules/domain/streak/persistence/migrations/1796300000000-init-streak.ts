import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the streak: the meaningful actions of the learners and the state their days build. */
export class InitStreak1796300000000 implements MigrationInterface {
    name = "InitStreak1796300000000"

    /** Creates streak_actions with its idempotency key and streak_states. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE streak_actions (
    learner_id uuid NOT NULL,
    action_id text NOT NULL,
    shard text NOT NULL,
    kind text NOT NULL,
    source_ref text,
    day date NOT NULL,
    recorded_at timestamptz NOT NULL,
    CONSTRAINT pk_streak_actions PRIMARY KEY (learner_id, action_id),
    CONSTRAINT ck_streak_actions_shard CHECK (shard IN ('essentials', 'review', 'practice', 'projects', 'incidents', 'interview')),
    CONSTRAINT ck_streak_actions_kind CHECK (kind IN ('review-due-done', 'graded-attempt', 'project-run', 'interview-submitted'))
)`)
        await queryRunner.query(`CREATE INDEX ix_streak_actions_day ON streak_actions (learner_id, day)`)
        await queryRunner.query(`CREATE TABLE streak_states (
    learner_id uuid PRIMARY KEY,
    current_streak integer NOT NULL,
    longest_streak integer NOT NULL,
    last_closed_day date NOT NULL,
    last_grant_week date NOT NULL,
    weekly_goal smallint NOT NULL,
    freezes_held smallint NOT NULL,
    shard_counters jsonb NOT NULL,
    freeze_days jsonb NOT NULL,
    badges jsonb NOT NULL,
    reminder jsonb,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_streak_states_goal CHECK (weekly_goal BETWEEN 2 AND 7),
    CONSTRAINT ck_streak_states_freezes CHECK (freezes_held >= 0)
)`)
    }

    /** Drops the streak tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE streak_states`)
        await queryRunner.query(`DROP TABLE streak_actions`)
    }
}
