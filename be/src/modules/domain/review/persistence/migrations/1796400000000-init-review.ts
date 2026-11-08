import type { MigrationInterface, QueryRunner } from "typeorm"

/** Creates the decks and their immutable versions, the cards, and the schedule, history, deck choices and goal of each learner. */
export class InitReview1796400000000 implements MigrationInterface {
    name = "InitReview1796400000000"

    /** Creates the review tables. */
    async up(queryRunner: QueryRunner): Promise<void> {
        await this.createCatalog(queryRunner)
        await this.createSchedule(queryRunner)
        await this.createLearnerChoices(queryRunner)
    }

    /** Creates the decks, their versions and the cards. */
    private async createCatalog(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE review_decks (
    deck_id text PRIMARY KEY,
    course text NOT NULL,
    sort_index integer NOT NULL,
    live_version text NOT NULL,
    difficulty varchar(16) NOT NULL,
    titles jsonb NOT NULL,
    descriptions jsonb NOT NULL,
    module_refs jsonb NOT NULL,
    tracks jsonb NOT NULL,
    card_count integer NOT NULL,
    free_card_count integer NOT NULL,
    updated_at timestamptz NOT NULL
)`)
        await queryRunner.query(`CREATE TABLE review_deck_versions (
    deck_id text NOT NULL,
    version text NOT NULL,
    content_hash text NOT NULL,
    source_hashes jsonb NOT NULL,
    imported_at timestamptz NOT NULL,
    CONSTRAINT pk_review_deck_versions PRIMARY KEY (deck_id, version)
)`)
        await queryRunner.query(`CREATE TABLE review_cards (
    item_id text NOT NULL,
    version text NOT NULL,
    deck_id text NOT NULL,
    sort_index integer NOT NULL,
    is_premium boolean NOT NULL,
    level varchar(16) NOT NULL,
    langs text,
    front jsonb NOT NULL,
    back jsonb NOT NULL,
    CONSTRAINT pk_review_cards PRIMARY KEY (item_id, version),
    CONSTRAINT ck_review_cards_level CHECK (level IN ('junior', 'middle', 'senior', 'staff'))
)`)
        await queryRunner.query(`CREATE INDEX ix_review_cards_deck ON review_cards (deck_id, version, sort_index)`)
    }

    /** Creates the schedule and the history of each learner. */
    private async createSchedule(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE review_states (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    source varchar(16) NOT NULL,
    status varchar(16) NOT NULL,
    step smallint NOT NULL,
    due_on date NOT NULL,
    added_by varchar(16) NOT NULL,
    deck_id text,
    lesson_id text,
    activity_id text,
    lesson_version text,
    after_days integer,
    suspended_from varchar(16),
    last_revision integer NOT NULL,
    flipped_revision integer NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT pk_review_states PRIMARY KEY (learner_id, item_id),
    CONSTRAINT ck_review_states_source CHECK (source IN ('flashcard', 'retrieval')),
    CONSTRAINT ck_review_states_status CHECK (status IN ('new', 'learning', 'review', 'done', 'suspended')),
    CONSTRAINT ck_review_states_added_by CHECK (added_by IN ('deck', 'lesson', 'track'))
)`)
        await queryRunner.query(`CREATE INDEX ix_review_states_due ON review_states (learner_id, status, due_on)`)
        await queryRunner.query(`CREATE TABLE review_reviews (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    revision integer NOT NULL,
    grade varchar(8) NOT NULL,
    cloze_correct boolean,
    answered_at timestamptz NOT NULL,
    answered_on date NOT NULL,
    CONSTRAINT pk_review_reviews PRIMARY KEY (learner_id, item_id, revision),
    CONSTRAINT ck_review_reviews_grade CHECK (grade IN ('again', 'hard', 'good', 'easy'))
)`)
        await queryRunner.query(`CREATE INDEX ix_review_reviews_day ON review_reviews (learner_id, answered_on)`)
    }

    /** Creates the written answers, the deck choices and the goal of each learner. */
    private async createLearnerChoices(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE review_answers (
    learner_id uuid NOT NULL,
    item_id text NOT NULL,
    revision integer NOT NULL,
    answer_text text NOT NULL,
    submitted_at timestamptz NOT NULL,
    CONSTRAINT pk_review_answers PRIMARY KEY (learner_id, item_id, revision)
)`)
        await queryRunner.query(`CREATE TABLE review_learner_decks (
    learner_id uuid NOT NULL,
    deck_id text NOT NULL,
    active boolean NOT NULL,
    added_at timestamptz NOT NULL,
    CONSTRAINT pk_review_learner_decks PRIMARY KEY (learner_id, deck_id)
)`)
        await queryRunner.query(`CREATE TABLE review_settings (
    learner_id uuid PRIMARY KEY,
    daily_goal integer NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_review_settings_goal CHECK (daily_goal BETWEEN 5 AND 50)
)`)
    }

    /** Drops the review tables. */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE review_settings`)
        await queryRunner.query(`DROP TABLE review_learner_decks`)
        await queryRunner.query(`DROP TABLE review_answers`)
        await queryRunner.query(`DROP TABLE review_reviews`)
        await queryRunner.query(`DROP TABLE review_states`)
        await queryRunner.query(`DROP TABLE review_cards`)
        await queryRunner.query(`DROP TABLE review_deck_versions`)
        await queryRunner.query(`DROP TABLE review_decks`)
    }
}
