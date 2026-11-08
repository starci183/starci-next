import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the immutable problem versions, the submissions of learners and the hint steps they revealed. */
export class InitPractice1796500000000 implements MigrationInterface {
    name = "InitPractice1796500000000"

    /** Creates practice_problem_versions with one live version per problem, practice_submissions and practice_hint_reveals. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE practice_problem_versions (
    problem_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status varchar(16) NOT NULL,
    pattern_id text NOT NULL,
    order_index integer NOT NULL,
    difficulty varchar(16) NOT NULL,
    tags jsonb NOT NULL,
    time_limit_ms integer NOT NULL,
    memory_limit_kb integer NOT NULL,
    titles jsonb NOT NULL,
    content jsonb NOT NULL,
    starter_codes jsonb NOT NULL,
    examples jsonb NOT NULL,
    tests jsonb NOT NULL,
    solutions jsonb NOT NULL,
    source_hashes jsonb NOT NULL,
    imported_at timestamptz NOT NULL,
    CONSTRAINT pk_practice_problem_versions PRIMARY KEY (problem_id, version),
    CONSTRAINT ck_practice_problem_versions_status CHECK (status IN ('published', 'superseded')),
    CONSTRAINT ck_practice_problem_versions_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')),
    CONSTRAINT ck_practice_problem_versions_limits CHECK (time_limit_ms > 0 AND memory_limit_kb > 0)
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_practice_problem_versions_published ON practice_problem_versions (problem_id) WHERE status = 'published'`,
        )
        await queryRunner.query(
            `CREATE INDEX ix_practice_problem_versions_pattern ON practice_problem_versions (pattern_id, order_index) WHERE status = 'published'`,
        )
        await queryRunner.query(`CREATE TABLE practice_submissions (
    submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    problem_version text NOT NULL,
    language varchar(16) NOT NULL,
    kind varchar(8) NOT NULL,
    source text NOT NULL,
    verdict varchar(24) NOT NULL,
    failure_code varchar(64),
    compile_output text,
    tests jsonb NOT NULL,
    passed_count integer NOT NULL,
    total_count integer NOT NULL,
    time_ms integer,
    memory_kb integer,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    finished_at timestamptz,
    CONSTRAINT ck_practice_submissions_language CHECK (language IN ('cpp', 'java', 'javascript', 'python', 'typescript')),
    CONSTRAINT ck_practice_submissions_kind CHECK (kind IN ('run', 'submit')),
    CONSTRAINT ck_practice_submissions_verdict CHECK (verdict IN ('queued', 'running', 'accepted', 'wrong-answer', 'time-limit-exceeded', 'compile-error', 'runtime-error', 'internal-error')),
    CONSTRAINT ck_practice_submissions_counts CHECK (passed_count >= 0 AND total_count >= 0 AND passed_count <= total_count)
)`)
        await queryRunner.query(
            `CREATE INDEX ix_practice_submissions_learner ON practice_submissions (learner_id, created_at DESC)`,
        )
        await queryRunner.query(
            `CREATE INDEX ix_practice_submissions_problem ON practice_submissions (learner_id, problem_id, kind, verdict)`,
        )
        await queryRunner.query(`CREATE TABLE practice_hint_reveals (
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    step smallint NOT NULL,
    revealed_at timestamptz NOT NULL,
    CONSTRAINT pk_practice_hint_reveals PRIMARY KEY (learner_id, problem_id, step),
    CONSTRAINT ck_practice_hint_reveals_step CHECK (step BETWEEN 1 AND 3)
)`)
    }

    /** Drops the practice tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE practice_hint_reveals`)
        await queryRunner.query(`DROP TABLE practice_submissions`)
        await queryRunner.query(`DROP TABLE practice_problem_versions`)
    }
}
