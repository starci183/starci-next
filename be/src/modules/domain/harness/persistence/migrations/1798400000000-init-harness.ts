import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the harness tables: immutable content versions, the build to project bindings and the attested stage proofs. */
export class InitHarness1798400000000 implements MigrationInterface {
    name = "InitHarness1798400000000"

    /** Creates harness_contents, harness_build_bindings and harness_stage_proofs. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE harness_contents (
    kind text NOT NULL,
    content_key text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    status varchar(16) NOT NULL,
    sort_index integer NOT NULL,
    content jsonb NOT NULL,
    pack bytea,
    pack_sha256 text,
    imported_at timestamptz NOT NULL,
    CONSTRAINT pk_harness_contents PRIMARY KEY (kind, content_key, version),
    CONSTRAINT ck_harness_contents_kind CHECK (kind IN ('build', 'guide', 'doc', 'probe', 'trap', 'doctor-pack')),
    CONSTRAINT ck_harness_contents_status CHECK (status IN ('published', 'superseded'))
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_harness_contents_published ON harness_contents (kind, content_key) WHERE status = 'published'`,
        )
        await queryRunner.query(`CREATE TABLE harness_build_bindings (
    learner_id uuid NOT NULL,
    build_id text NOT NULL,
    project_id uuid NOT NULL,
    bound_at timestamptz NOT NULL,
    CONSTRAINT pk_harness_build_bindings PRIMARY KEY (learner_id, build_id)
)`)
        await queryRunner.query(`CREATE TABLE harness_stage_proofs (
    learner_id uuid NOT NULL,
    build_id text NOT NULL,
    stage_id text NOT NULL,
    e2e_id text NOT NULL,
    run_id text NOT NULL,
    passed boolean NOT NULL,
    commit_sha text,
    project_id uuid NOT NULL,
    recorded_at timestamptz NOT NULL,
    CONSTRAINT pk_harness_stage_proofs PRIMARY KEY (learner_id, build_id, stage_id, e2e_id, run_id)
)`)
        await queryRunner.query(
            `CREATE INDEX ix_harness_stage_proofs_learner ON harness_stage_proofs (learner_id, build_id, recorded_at DESC)`,
        )
    }

    /** Drops the harness tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE harness_stage_proofs`)
        await queryRunner.query(`DROP TABLE harness_build_bindings`)
        await queryRunner.query(`DROP TABLE harness_contents`)
    }
}
