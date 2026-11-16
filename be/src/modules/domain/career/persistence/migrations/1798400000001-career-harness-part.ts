import type { MigrationInterface, QueryRunner } from "typeorm"

/** Lets the career items name the harness part: replaces the part check of the experience items. */
export class CareerHarnessPart1798400000001 implements MigrationInterface {
    name = "CareerHarnessPart1798400000001"

    /** Drops the part check and adds it back with the harness part. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE career_experience_items DROP CONSTRAINT career_experience_items_part_check`,
        )
        await queryRunner.query(
            `ALTER TABLE career_experience_items ADD CONSTRAINT career_experience_items_part_check CHECK (part IN ('essentials', 'projects', 'incidents', 'practice', 'interview', 'harness'))`,
        )
    }

    /** Restores the check without the harness part. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE career_experience_items DROP CONSTRAINT career_experience_items_part_check`,
        )
        await queryRunner.query(
            `ALTER TABLE career_experience_items ADD CONSTRAINT career_experience_items_part_check CHECK (part IN ('essentials', 'projects', 'incidents', 'practice', 'interview'))`,
        )
    }
}
