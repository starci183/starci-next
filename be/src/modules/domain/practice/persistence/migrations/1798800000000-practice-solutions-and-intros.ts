import type { MigrationInterface, QueryRunner } from "typeorm"

/** Adds the written solution of a problem, the solution reveals of learners and the introduction of a pattern. */
export class PracticeSolutionsAndIntros1798800000000 implements MigrationInterface {
    name = "PracticeSolutionsAndIntros1798800000000"

    /** Adds the explanations column, practice_solution_reveals and practice_pattern_intros. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE practice_problem_versions ADD COLUMN explanations jsonb NOT NULL DEFAULT '{"vi": "", "en": ""}'::jsonb`,
        )
        await queryRunner.query(`CREATE TABLE practice_solution_reveals (
    learner_id uuid NOT NULL,
    problem_id text NOT NULL,
    revealed_at timestamptz NOT NULL,
    CONSTRAINT pk_practice_solution_reveals PRIMARY KEY (learner_id, problem_id)
)`)
        await queryRunner.query(`CREATE TABLE practice_pattern_intros (
    pattern_id text NOT NULL,
    locale varchar(8) NOT NULL,
    intro text NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_practice_pattern_intros PRIMARY KEY (pattern_id, locale),
    CONSTRAINT ck_practice_pattern_intros_locale CHECK (locale IN ('vi', 'en'))
)`)
    }

    /** Drops what up added. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE practice_pattern_intros`)
        await queryRunner.query(`DROP TABLE practice_solution_reveals`)
        await queryRunner.query(`ALTER TABLE practice_problem_versions DROP COLUMN explanations`)
    }
}
