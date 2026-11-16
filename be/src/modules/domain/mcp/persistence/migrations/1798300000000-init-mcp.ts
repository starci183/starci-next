import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates mcp_access_tokens: the learner's personal access tokens for their AI client, kept only as digests. */
export class InitMcp1798300000000 implements MigrationInterface {
    name = "InitMcp1798300000000"

    /** Creates the table with its lookup by digest and its list by learner. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE mcp_access_tokens (
    token_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    token_digest varchar(64) NOT NULL,
    hint varchar(4) NOT NULL,
    created_at timestamptz NOT NULL,
    last_used_at timestamptz,
    revoked_at timestamptz
)`)
        await queryRunner.query(`CREATE UNIQUE INDEX ux_mcp_access_tokens_digest ON mcp_access_tokens (token_digest)`)
        await queryRunner.query(
            `CREATE INDEX ix_mcp_access_tokens_learner ON mcp_access_tokens (learner_id, created_at DESC)`,
        )
    }

    /** Drops the table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE mcp_access_tokens`)
    }
}
