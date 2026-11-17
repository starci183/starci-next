import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Removes the retired mock interview from the part check of the experience items: the capability that granted it is gone, so no
 * item may name it. ADD CONSTRAINT validates the existing rows, so a database that still holds an interview item refuses this
 * migration instead of keeping a part nothing reads.
 */
export class CareerDropInterviewPart1798700000000 implements MigrationInterface {
    name = "CareerDropInterviewPart1798700000000"

    /** Drops the part check and adds it back without the interview part. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE career_experience_items DROP CONSTRAINT career_experience_items_part_check`,
        )
        await queryRunner.query(
            `ALTER TABLE career_experience_items ADD CONSTRAINT career_experience_items_part_check CHECK (part IN ('essentials', 'projects', 'incidents', 'practice', 'harness'))`,
        )
    }

    /** Restores the check that still allows the interview part. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE career_experience_items DROP CONSTRAINT career_experience_items_part_check`,
        )
        await queryRunner.query(
            `ALTER TABLE career_experience_items ADD CONSTRAINT career_experience_items_part_check CHECK (part IN ('essentials', 'projects', 'incidents', 'practice', 'interview', 'harness'))`,
        )
    }
}
