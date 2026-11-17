import type { MigrationInterface, QueryRunner } from "typeorm"

/** Makes review free for every learner: drops the Premium mark of a card and the free card count of a deck. */
export class ReviewFreeForEveryone1798800000001 implements MigrationInterface {
    name = "ReviewFreeForEveryone1798800000001"

    /** Drops review_cards.is_premium and review_decks.free_card_count. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE review_cards DROP COLUMN is_premium`)
        await queryRunner.query(`ALTER TABLE review_decks DROP COLUMN free_card_count`)
    }

    /** Adds the columns back: every card free, every deck counting all its cards as free. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE review_decks ADD COLUMN free_card_count integer NOT NULL DEFAULT 0`)
        await queryRunner.query(`UPDATE review_decks SET free_card_count = card_count`)
        await queryRunner.query(`ALTER TABLE review_decks ALTER COLUMN free_card_count DROP DEFAULT`)
        await queryRunner.query(`ALTER TABLE review_cards ADD COLUMN is_premium boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE review_cards ALTER COLUMN is_premium DROP DEFAULT`)
    }
}
