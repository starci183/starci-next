import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * The check set of the Projects shard (the catalog, the shared probes and the learner kit) comes from the seed standard through the
 * app's seed door, so it lives in the database instead of in a checkout the api would have to find on disk.
 */
export class ProjectCheckDocuments1798650000000 implements MigrationInterface {
    name = "ProjectCheckDocuments1798650000000"

    /** Creates the table of check documents, keyed by set and natural key. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE project_check_documents (
    document_set text NOT NULL,
    document_key text NOT NULL,
    body jsonb NOT NULL,
    imported_at timestamptz NOT NULL,
    CONSTRAINT pk_project_check_documents PRIMARY KEY (document_set, document_key)
)`)
    }

    /** Drops the table; the next load of the standard fills it again. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE project_check_documents`)
    }
}
