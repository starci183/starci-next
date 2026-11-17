import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Moves the proof of a build off Projects (owner 2026-11-17: /harness is free): a build is bound to a GitHub repository of the
 * learner, not to a project. The binding gets its own id, which the workflow sends, and the repository GitHub names in the first
 * attested run is remembered.
 */
export class HarnessRepoBinding1798500000000 implements MigrationInterface {
    name = "HarnessRepoBinding1798500000000"

    /** Replaces the project column of the bindings and the proofs. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE harness_build_bindings
    DROP COLUMN project_id,
    ADD COLUMN binding_id uuid NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN repository text NOT NULL DEFAULT '',
    ADD COLUMN repository_id text`)
        await queryRunner.query(`ALTER TABLE harness_build_bindings ALTER COLUMN repository DROP DEFAULT`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_harness_build_bindings_binding ON harness_build_bindings (binding_id)`,
        )
        await queryRunner.query(`ALTER TABLE harness_stage_proofs
    DROP COLUMN project_id,
    ADD COLUMN binding_id uuid NOT NULL DEFAULT gen_random_uuid()`)
        await queryRunner.query(`ALTER TABLE harness_stage_proofs ALTER COLUMN binding_id DROP DEFAULT`)
    }

    /** Restores the project columns. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE harness_stage_proofs DROP COLUMN binding_id, ADD COLUMN project_id uuid NOT NULL DEFAULT gen_random_uuid()`,
        )
        await queryRunner.query(`DROP INDEX ux_harness_build_bindings_binding`)
        await queryRunner.query(`ALTER TABLE harness_build_bindings
    DROP COLUMN repository_id,
    DROP COLUMN repository,
    DROP COLUMN binding_id,
    ADD COLUMN project_id uuid NOT NULL DEFAULT gen_random_uuid()`)
    }
}
