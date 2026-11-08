import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates interview_questions and its tier index. */
const createQuestions = async (queryRunner: QueryRunner): Promise<void> => {
    await queryRunner.query(`CREATE TABLE interview_questions (
    bank_id text NOT NULL,
    bank_version text NOT NULL,
    question_id text NOT NULL,
    sort_index integer NOT NULL,
    is_premium boolean NOT NULL,
    family varchar(16) NOT NULL,
    tier varchar(8) NOT NULL,
    kind varchar(32) NOT NULL,
    tags text[] NOT NULL DEFAULT '{}',
    competency text,
    leadership_tier text,
    bodies jsonb NOT NULL,
    interviewer jsonb NOT NULL,
    grading jsonb NOT NULL,
    CONSTRAINT pk_interview_questions PRIMARY KEY (bank_id, bank_version, question_id),
    CONSTRAINT fk_interview_questions_bank FOREIGN KEY (bank_id, bank_version)
        REFERENCES interview_banks (bank_id, version) ON DELETE CASCADE,
    CONSTRAINT ck_interview_questions_family CHECK (family IN ('technical', 'behavioral')),
    CONSTRAINT ck_interview_questions_tier CHECK (tier IN ('junior', 'middle', 'senior'))
)`)
    await queryRunner.query(`CREATE INDEX ix_interview_questions_tier ON interview_questions (tier, family)`)
}

/** Creates interview_sessions with its keys and checks. */
const createSessions = async (queryRunner: QueryRunner): Promise<void> => {
    await queryRunner.query(`CREATE TABLE interview_sessions (
    session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    client_request_id text NOT NULL,
    track text NOT NULL,
    tier varchar(8) NOT NULL,
    locale varchar(8) NOT NULL,
    language text,
    length integer NOT NULL,
    access varchar(8) NOT NULL,
    free_month varchar(7),
    questions jsonb NOT NULL,
    current_position integer NOT NULL DEFAULT 0,
    status varchar(16) NOT NULL,
    scorecard jsonb,
    failure_code varchar(64),
    graded_by jsonb,
    overall_score integer,
    verdict varchar(12),
    technical_score integer,
    technical_verdict varchar(12),
    behavioral_score integer,
    behavioral_verdict varchar(12),
    started_at timestamptz NOT NULL,
    submitted_at timestamptz,
    graded_at timestamptz,
    last_activity_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_interview_sessions_status CHECK (status IN ('active', 'submitted', 'grading', 'graded', 'failed', 'abandoned')),
    CONSTRAINT ck_interview_sessions_access CHECK (access IN ('free', 'premium')),
    CONSTRAINT ck_interview_sessions_tier CHECK (tier IN ('junior', 'middle', 'senior')),
    CONSTRAINT ck_interview_sessions_locale CHECK (locale IN ('vi', 'en')),
    CONSTRAINT ck_interview_sessions_scorecard CHECK ((status = 'graded') = (scorecard IS NOT NULL)),
    CONSTRAINT ck_interview_sessions_failure CHECK ((status = 'failed') = (failure_code IS NOT NULL))
)`)
    await queryRunner.query(
        `CREATE UNIQUE INDEX ux_interview_sessions_request ON interview_sessions (learner_id, client_request_id)`,
    )
    await queryRunner.query(
        `CREATE UNIQUE INDEX ux_interview_sessions_active ON interview_sessions (learner_id) WHERE status = 'active'`,
    )
    await queryRunner.query(
        `CREATE INDEX ix_interview_sessions_learner ON interview_sessions (learner_id, started_at DESC)`,
    )
}

/** Creates interview_turns with its keys and checks. */
const createTurns = async (queryRunner: QueryRunner): Promise<void> => {
    await queryRunner.query(`CREATE TABLE interview_turns (
    turn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES interview_sessions (session_id) ON DELETE CASCADE,
    seq integer NOT NULL,
    position integer NOT NULL,
    role varchar(12) NOT NULL,
    kind varchar(12) NOT NULL,
    content text NOT NULL,
    revision integer,
    by_ai boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_interview_turns_role CHECK (role IN ('interviewer', 'candidate')),
    CONSTRAINT ck_interview_turns_kind CHECK (kind IN ('prompt', 'followUp', 'probe', 'hint', 'answer', 'skip', 'done')),
    CONSTRAINT ck_interview_turns_revision CHECK ((role = 'candidate') = (revision IS NOT NULL))
)`)
    await queryRunner.query(`CREATE UNIQUE INDEX ux_interview_turns_seq ON interview_turns (session_id, seq)`)
    await queryRunner.query(
        `CREATE UNIQUE INDEX ux_interview_turns_candidate ON interview_turns (session_id, position, revision) WHERE role = 'candidate'`,
    )
}

/** Creates the interview banks and questions, the sessions and their turns. */
export class InitInterview1796300000000 implements MigrationInterface {
    name = "InitInterview1796300000000"

    /** Creates interview_banks, interview_questions, interview_sessions and interview_turns with their keys and checks. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE interview_banks (
    bank_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status varchar(16) NOT NULL,
    family varchar(16) NOT NULL,
    course text,
    sort_index integer NOT NULL,
    difficulty varchar(16) NOT NULL,
    titles jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    module_refs text[] NOT NULL DEFAULT '{}',
    question_count integer NOT NULL,
    calibration jsonb,
    imported_at timestamptz NOT NULL,
    published_at timestamptz,
    CONSTRAINT pk_interview_banks PRIMARY KEY (bank_id, version),
    CONSTRAINT ck_interview_banks_status CHECK (status IN ('validated', 'published', 'superseded')),
    CONSTRAINT ck_interview_banks_family CHECK (family IN ('technical', 'behavioral')),
    CONSTRAINT ck_interview_banks_published CHECK ((status = 'published') = (published_at IS NOT NULL) OR status = 'superseded')
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_interview_banks_live ON interview_banks (bank_id) WHERE status = 'published'`,
        )
        await createQuestions(queryRunner)
        await createSessions(queryRunner)
        await createTurns(queryRunner)
    }

    /** Drops the interview tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE interview_turns`)
        await queryRunner.query(`DROP TABLE interview_sessions`)
        await queryRunner.query(`DROP TABLE interview_questions`)
        await queryRunner.query(`DROP TABLE interview_banks`)
    }
}
