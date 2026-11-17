import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Creates mcp_vector_points: one row per indexed chunk (content hash, source, version of its content, access class, when it was
 * written to Qdrant). The vector lives in Qdrant under the row point id and the text is never stored; a row with no sync time is
 * pending and is written again by the next job.
 */
export class AddMcpVectorPoints1798400000000 implements MigrationInterface {
    name = "AddMcpVectorPoints1798400000000"

    /** Creates the table with its natural key and the scope read. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE mcp_vector_points (
    point_id uuid PRIMARY KEY,
    kind text NOT NULL CHECK (kind IN ('lesson', 'code', 'harness')),
    source_id text NOT NULL CHECK (char_length(source_id) BETWEEN 1 AND 120),
    locale text NOT NULL CHECK (char_length(locale) BETWEEN 1 AND 8),
    content_hash varchar(64) NOT NULL,
    part text NOT NULL,
    access text NOT NULL CHECK (access IN ('free', 'premium')),
    synced_at timestamptz
)`)
        await queryRunner.query(
            `CREATE UNIQUE INDEX ux_mcp_vector_points_chunk ON mcp_vector_points (kind, source_id, locale, content_hash)`,
        )
        await queryRunner.query(
            `CREATE INDEX ix_mcp_vector_points_pending ON mcp_vector_points (kind, source_id) WHERE synced_at IS NULL`,
        )
    }

    /** Drops the table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE mcp_vector_points`)
    }
}
