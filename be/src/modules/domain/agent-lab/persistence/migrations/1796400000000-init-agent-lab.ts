import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the daily model-call counter of the agent lab, one row per learner and UTC day. */
export class InitAgentLab1796400000000 implements MigrationInterface {
    name = "InitAgentLab1796400000000"

    /** Creates agent_lab_usage. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE agent_lab_usage (
    learner_id uuid NOT NULL,
    usage_day date NOT NULL,
    calls integer NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_agent_lab_usage PRIMARY KEY (learner_id, usage_day),
    CONSTRAINT ck_agent_lab_usage_calls CHECK (calls >= 0)
)`)
    }

    /** Drops the counter. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE agent_lab_usage`)
    }
}
