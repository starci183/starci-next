import type { MigrationInterface, QueryRunner } from "typeorm"

/**
 * Drops the tables of the retired mock interview and agent lab: the code that owned them is gone. Children go before parents
 * (turns, sessions, questions, banks), so no CASCADE is needed; IF EXISTS keeps a database that never had them (a fresh one) quiet.
 */
export class DropRetiredInterviewAgentLab1798600000000 implements MigrationInterface {
    name = "DropRetiredInterviewAgentLab1798600000000"

    /** Drops the four interview tables and the agent lab usage counter. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS interview_turns`)
        await queryRunner.query(`DROP TABLE IF EXISTS interview_sessions`)
        await queryRunner.query(`DROP TABLE IF EXISTS interview_questions`)
        await queryRunner.query(`DROP TABLE IF EXISTS interview_banks`)
        await queryRunner.query(`DROP TABLE IF EXISTS agent_lab_usage`)
    }

    /** Recreates nothing: no code reads these tables and their rows are not recoverable, so a revert leaves them dropped. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`SELECT 1`)
    }
}
