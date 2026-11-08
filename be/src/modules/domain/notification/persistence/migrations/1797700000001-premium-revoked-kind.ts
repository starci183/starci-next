import type { MigrationInterface, QueryRunner } from "typeorm"

/** Lets the notifications table store premium.revoked, which commerce sends when a provider voids a paid order. */
export class PremiumRevokedKind1797700000001 implements MigrationInterface {
    name = "PremiumRevokedKind1797700000001"

    /** Replaces the kind check with the one that also lists premium.revoked. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT ck_notifications_kind`)
        await queryRunner.query(
            `ALTER TABLE notifications ADD CONSTRAINT ck_notifications_kind CHECK (kind IN ('premium.activated', 'premium.revoked', 'experience.verified', 'experience.returned', 'review.due', 'project.milestone-proved', 'project.deployed'))`,
        )
    }

    /** Restores the previous kind check; premium.revoked notifications are removed first, since it would refuse them. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM notifications WHERE kind = 'premium.revoked'`)
        await queryRunner.query(`ALTER TABLE notifications DROP CONSTRAINT ck_notifications_kind`)
        await queryRunner.query(
            `ALTER TABLE notifications ADD CONSTRAINT ck_notifications_kind CHECK (kind IN ('premium.activated', 'experience.verified', 'experience.returned', 'review.due', 'project.milestone-proved', 'project.deployed'))`,
        )
    }
}
