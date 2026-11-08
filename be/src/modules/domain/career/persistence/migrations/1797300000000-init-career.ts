import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the experience items, their append-only review decisions and the reviewer appointments of the career capability. */
export class InitCareer1797300000000 implements MigrationInterface {
    name = "InitCareer1797300000000"

    /** Creates the three tables and the indexes the queue, the learner list and the verification page read. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE career_experience_items (
    item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_code text NOT NULL UNIQUE,
    learner_id uuid NOT NULL,
    item_type text NOT NULL,
    part text NOT NULL CHECK (part IN ('essentials', 'projects', 'incidents', 'practice', 'interview')),
    subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 300),
    project_id text,
    evidence jsonb NOT NULL CHECK (jsonb_typeof(evidence) = 'array'),
    evidence_revision integer NOT NULL DEFAULT 1,
    slot_values jsonb NOT NULL,
    grade jsonb,
    draft_line jsonb,
    line jsonb,
    state text NOT NULL CHECK (state IN ('practising', 'ai-graded', 'pending-review', 'verified', 'returned', 'revoked')),
    assignee_id uuid,
    teacher_only boolean NOT NULL DEFAULT false,
    submitted_at timestamptz,
    due_at timestamptz,
    signer_id uuid,
    signer_role text CHECK (signer_role IN ('TEACHER', 'REVIEWER')),
    signed_at timestamptz,
    revoked_at timestamptz,
    return_note text,
    return_count integer NOT NULL DEFAULT 0,
    returned_line jsonb,
    returned_evidence_revision integer,
    shown_publicly boolean NOT NULL DEFAULT false,
    revision integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CHECK (state <> 'verified' OR (signer_id IS NOT NULL AND signed_at IS NOT NULL)),
    CHECK (shown_publicly = false OR state = 'verified')
)`)
        await queryRunner.query(`CREATE UNIQUE INDEX ux_career_items_open ON career_experience_items (learner_id, item_type, subject)
    WHERE state <> 'revoked'`)
        await queryRunner.query(
            `CREATE INDEX ix_career_items_learner ON career_experience_items (learner_id, updated_at DESC)`,
        )
        await queryRunner.query(`CREATE INDEX ix_career_items_queue ON career_experience_items (state, due_at)`)
        await queryRunner.query(`CREATE TABLE career_review_decisions (
    decision_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL REFERENCES career_experience_items (item_id),
    action text NOT NULL CHECK (action IN ('grade', 'submit', 'resubmit', 'assign', 'approve', 'return', 'escalate', 'revoke')),
    actor_id uuid,
    actor_role text NOT NULL CHECK (actor_role IN ('learner', 'REVIEWER', 'TEACHER', 'system')),
    from_state text,
    to_state text NOT NULL,
    note text,
    snapshot jsonb NOT NULL,
    at timestamptz NOT NULL
)`)
        await queryRunner.query(`CREATE INDEX ix_career_decisions_item ON career_review_decisions (item_id, at)`)
        await queryRunner.query(`CREATE TABLE career_reviewers (
    appointment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id uuid NOT NULL,
    parts jsonb NOT NULL CHECK (jsonb_typeof(parts) = 'array'),
    capacity integer NOT NULL CHECK (capacity > 0),
    conflicts jsonb NOT NULL CHECK (jsonb_typeof(conflicts) = 'array'),
    appointed_by uuid NOT NULL,
    appointed_at timestamptz NOT NULL,
    ended_at timestamptz
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_career_reviewers_active ON career_reviewers (reviewer_id) WHERE ended_at IS NULL`,
        )
    }

    /** Drops the indexes and the tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ux_career_reviewers_active`)
        await queryRunner.query(`DROP TABLE career_reviewers`)
        await queryRunner.query(`DROP INDEX ix_career_decisions_item`)
        await queryRunner.query(`DROP TABLE career_review_decisions`)
        await queryRunner.query(`DROP INDEX ix_career_items_queue`)
        await queryRunner.query(`DROP INDEX ix_career_items_learner`)
        await queryRunner.query(`DROP INDEX ux_career_items_open`)
        await queryRunner.query(`DROP TABLE career_experience_items`)
    }
}
