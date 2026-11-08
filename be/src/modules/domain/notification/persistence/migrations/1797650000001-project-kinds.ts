import type { MigrationInterface, QueryRunner } from "typeorm"

/** Lets the notifications table store the two kinds the Projects shard sends: a milestone proved and a deployment that passed the probes. */
export class ProjectKinds1797650000001 implements MigrationInterface {
    name = "ProjectKinds1797650000001"

    /** Replaces the kind check with the one that also lists project.milestone-proved and project.deployed. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT ck_notifications_kind`)
        await queryRunner.query(
            `ALTER TABLE notifications ADD CONSTRAINT ck_notifications_kind CHECK (kind IN ('premium.activated', 'experience.verified', 'experience.returned', 'review.due', 'project.milestone-proved', 'project.deployed'))`,
        )
    }

    /** Restores the first kind check; notifications of the project kinds are removed first, since the old check would refuse them. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DELETE FROM notifications WHERE kind IN ('project.milestone-proved', 'project.deployed')`,
        )
        await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT ck_notifications_kind`)
        await queryRunner.query(
            `ALTER TABLE notifications ADD CONSTRAINT ck_notifications_kind CHECK (kind IN ('premium.activated', 'experience.verified', 'experience.returned', 'review.due'))`,
        )
    }
}
