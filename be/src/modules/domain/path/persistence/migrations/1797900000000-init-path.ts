import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the path choice: the one outcome path each learner follows, with the paths followed before. */
export class InitPath1797900000000 implements MigrationInterface {
    name = "InitPath1797900000000"

    /** Creates path_choices. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE path_choices (
    learner_id uuid PRIMARY KEY,
    active_path_id text NOT NULL,
    chosen_at timestamptz NOT NULL,
    history jsonb NOT NULL,
    CONSTRAINT ck_path_choices_path CHECK (active_path_id IN ('founder', 'ai-engineer', 'backend-fullstack', 'devops-sre', 'system-design-senior'))
)`)
    }

    /** Drops path_choices. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE path_choices`)
    }
}
