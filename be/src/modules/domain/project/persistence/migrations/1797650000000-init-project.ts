import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the learner projects, their per-concept pointers, the append-only evidence, the signed CI runs, the probe runs and the once-only proofs. */
export class InitProject1797650000000 implements MigrationInterface {
    name = "InitProject1797650000000"

    /** Creates projects, project_concepts, project_evidence, project_ci_runs, project_probe_runs and project_proofs. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE projects (
    project_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    name text NOT NULL,
    kind varchar(8) NOT NULL,
    topic text NOT NULL,
    language text NOT NULL,
    stack text NOT NULL,
    track varchar(16),
    sample_id text,
    repo_url text,
    deployed_url text,
    ci_secret text NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_projects_kind CHECK (kind IN ('app', 'agent')),
    CONSTRAINT ck_projects_track CHECK (track IS NULL OR track IN ('claude', 'openclaw', 'hermes'))
)`)
        await queryRunner.query(`CREATE INDEX ix_projects_learner ON projects (learner_id, created_at DESC)`)
        await queryRunner.query(`CREATE TABLE project_concepts (
    project_id uuid NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    concept_id text NOT NULL,
    location text,
    endpoint text,
    sample_body text,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_project_concepts PRIMARY KEY (project_id, concept_id)
)`)
        await queryRunner.query(`CREATE TABLE project_evidence (
    evidence_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    concept_id text NOT NULL,
    slot varchar(12) NOT NULL,
    source varchar(16) NOT NULL,
    passed boolean NOT NULL,
    ref text NOT NULL,
    run_id text NOT NULL,
    commit_sha text,
    detail jsonb NOT NULL,
    at timestamptz NOT NULL,
    CONSTRAINT ck_project_evidence_slot CHECK (slot IN ('test', 'e2e', 'probe', 'code-read')),
    CONSTRAINT ck_project_evidence_source CHECK (source IN ('relay', 'ci', 'server-probe', 'ai')),
    CONSTRAINT ux_project_evidence_run UNIQUE (project_id, source, run_id, concept_id, slot, ref)
)`)
        await queryRunner.query(
            `CREATE INDEX ix_project_evidence_latest ON project_evidence (project_id, concept_id, slot, source, ref, at DESC)`,
        )
        await queryRunner.query(`CREATE TABLE project_ci_runs (
    project_id uuid NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    run_id text NOT NULL,
    commit_sha text NOT NULL,
    passed boolean NOT NULL,
    received_at timestamptz NOT NULL,
    CONSTRAINT pk_project_ci_runs PRIMARY KEY (project_id, run_id)
)`)
        await queryRunner.query(`CREATE TABLE project_probe_runs (
    run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    url text NOT NULL,
    passed boolean NOT NULL,
    results jsonb NOT NULL,
    at timestamptz NOT NULL
)`)
        await queryRunner.query(
            `CREATE INDEX ix_project_probe_runs_project ON project_probe_runs (project_id, at DESC)`,
        )
        await queryRunner.query(`CREATE TABLE project_proofs (
    project_id uuid NOT NULL REFERENCES projects (project_id) ON DELETE CASCADE,
    subject text NOT NULL,
    proved_at timestamptz NOT NULL,
    CONSTRAINT pk_project_proofs PRIMARY KEY (project_id, subject)
)`)
    }

    /** Drops the tables in dependency order. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE project_proofs`)
        await queryRunner.query(`DROP TABLE project_probe_runs`)
        await queryRunner.query(`DROP TABLE project_ci_runs`)
        await queryRunner.query(`DROP TABLE project_evidence`)
        await queryRunner.query(`DROP TABLE project_concepts`)
        await queryRunner.query(`DROP TABLE projects`)
    }
}
