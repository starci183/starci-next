import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * GitHub attestation of CI runs (decision Q-PJ-1): a project records the GitHub repository its runs must come from, a CI run records
 * whether GitHub vouched for it, and a run StarCi could not attest keeps its results as practice (`ci-signed`), never as proof. The
 * runs recorded before carried the HMAC only, so they become signed-only practice.
 */
export class ProjectCiAttestation1798000000000 implements MigrationInterface {
    name = "ProjectCiAttestation1798000000000"

    /** Adds the repository binding, the run attestation and the signed-only evidence source. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE projects ADD COLUMN github_repository text, ADD COLUMN github_repository_id text`,
        )
        await queryRunner.query(`ALTER TABLE project_ci_runs ADD COLUMN attestation varchar(16) NOT NULL DEFAULT 'signed-only',
    ADD CONSTRAINT ck_project_ci_runs_attestation CHECK (attestation IN ('attested', 'signed-only'))`)
        await queryRunner.query(`ALTER TABLE project_evidence DROP CONSTRAINT ck_project_evidence_source`)
        await queryRunner.query(`UPDATE project_evidence SET source = 'ci-signed' WHERE source = 'ci'`)
        await queryRunner.query(`ALTER TABLE project_evidence ADD CONSTRAINT ck_project_evidence_source
    CHECK (source IN ('relay', 'ci', 'ci-signed', 'server-probe', 'ai'))`)
    }

    /** Folds signed-only evidence back into CI and drops the attestation and the binding. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE project_evidence DROP CONSTRAINT ck_project_evidence_source`)
        await queryRunner.query(`UPDATE project_evidence SET source = 'ci' WHERE source = 'ci-signed'`)
        await queryRunner.query(`ALTER TABLE project_evidence ADD CONSTRAINT ck_project_evidence_source
    CHECK (source IN ('relay', 'ci', 'server-probe', 'ai'))`)
        await queryRunner.query(
            `ALTER TABLE project_ci_runs DROP CONSTRAINT ck_project_ci_runs_attestation, DROP COLUMN attestation`,
        )
        await queryRunner.query(`ALTER TABLE projects DROP COLUMN github_repository_id, DROP COLUMN github_repository`)
    }
}
