import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the notifications of the learners: a kind and its params, never message text. */
export class InitNotification1797400000000 implements MigrationInterface {
    name = "InitNotification1797400000000"

    /** Creates notifications with the index of the newest-first page and the index of the unread count. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id uuid NOT NULL,
    kind text NOT NULL,
    params jsonb NOT NULL,
    link text,
    created_at timestamptz NOT NULL,
    read_at timestamptz,
    CONSTRAINT ck_notifications_kind CHECK (kind IN ('premium.activated', 'experience.verified', 'experience.returned', 'review.due')),
    CONSTRAINT ck_notifications_params CHECK (jsonb_typeof(params) = 'object'),
    CONSTRAINT ck_notifications_link CHECK (link IS NULL OR (link LIKE '/%' AND link NOT LIKE '//%' AND strpos(link, chr(92)) = 0))
)`)
        await queryRunner.query(
            `CREATE INDEX ix_notifications_learner_page ON notifications (learner_id, created_at DESC, id DESC)`,
        )
        await queryRunner.query(
            `CREATE INDEX ix_notifications_learner_unread ON notifications (learner_id) WHERE read_at IS NULL`,
        )
    }

    /** Drops the indexes and the table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ix_notifications_learner_unread`)
        await queryRunner.query(`DROP INDEX ix_notifications_learner_page`)
        await queryRunner.query(`DROP TABLE notifications`)
    }
}
