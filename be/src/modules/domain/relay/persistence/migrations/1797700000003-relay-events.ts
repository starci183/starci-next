import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Creates relay_events: the practice events a paired device uploads (check started, check result, log, manifest ack), each
 * once per (device, client event id), so a CLI that resends after a reconnect stores nothing twice. A device also gets
 * `online_since`, set while its socket is open, and a last contact that only socket and upload activity moves.
 */
export class RelayEvents1797700000003 implements MigrationInterface {
    name = "RelayEvents1797700000003"

    /** Creates the event table, unique per device and client event id, with the reads of the project practice port. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE relay_events (
    device_id uuid NOT NULL,
    event_id uuid NOT NULL,
    learner_id uuid NOT NULL,
    kind text NOT NULL,
    task_id text NOT NULL,
    run_id text NOT NULL,
    check_id text,
    concept_id text,
    slot text,
    ref text,
    passed boolean,
    exit_code integer,
    duration_ms integer,
    commit_sha text,
    body text,
    created_at timestamptz NOT NULL,
    PRIMARY KEY (device_id, event_id),
    CONSTRAINT ck_relay_events_kind CHECK (kind IN ('check.started', 'check.result', 'log', 'manifest.ack')),
    CONSTRAINT ck_relay_events_slot CHECK (slot IS NULL OR slot IN ('test', 'e2e', 'probe')),
    CONSTRAINT ck_relay_events_body CHECK (body IS NULL OR length(body) <= 16384)
)`)
        await queryRunner.query(`CREATE INDEX ix_relay_events_task ON relay_events (learner_id, task_id, created_at)`)
        await queryRunner.query(`ALTER TABLE relay_devices ADD COLUMN online_since timestamptz`)
        await queryRunner.query(`UPDATE relay_devices SET last_seen_at = NULL WHERE status <> 'revoked'`)
    }

    /** Drops the event table. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE relay_devices DROP COLUMN online_since`)
        await queryRunner.query(`DROP TABLE relay_events`)
    }
}
