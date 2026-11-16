import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Lets relay_events hold a lesson scenario run (SCENARIO-CONTRACT v2): the slot `scenario` joins test, e2e and probe, and
 * `detail` keeps what the learner CLI reports of the run (lesson, scenario, concepts, guards turned off, challenge tier, the
 * first `[invariant:..]` message and the ledger). Old rows keep a null detail.
 */
export class RelayEventDetail1797700000004 implements MigrationInterface {
    name = "RelayEventDetail1797700000004"

    /** Adds the detail column and widens the slot check. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE relay_events ADD COLUMN detail jsonb`)
        await queryRunner.query(`ALTER TABLE relay_events DROP CONSTRAINT ck_relay_events_slot`)
        await queryRunner.query(
            `ALTER TABLE relay_events ADD CONSTRAINT ck_relay_events_slot CHECK (slot IS NULL OR slot IN ('test', 'e2e', 'probe', 'scenario'))`,
        )
    }

    /** Drops the detail column and restores the slot check (scenario rows lose their slot). */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE relay_events SET slot = NULL WHERE slot = 'scenario'`)
        await queryRunner.query(`ALTER TABLE relay_events DROP CONSTRAINT ck_relay_events_slot`)
        await queryRunner.query(
            `ALTER TABLE relay_events ADD CONSTRAINT ck_relay_events_slot CHECK (slot IS NULL OR slot IN ('test', 'e2e', 'probe'))`,
        )
        await queryRunner.query(`ALTER TABLE relay_events DROP COLUMN detail`)
    }
}
