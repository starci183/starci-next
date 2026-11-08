import { sql } from "@modules/platform/database"

/** Reads the hash a deck version was stored with ($1 deck, $2 version). */
export const SELECT_DECK_VERSION_HASH: ReturnType<typeof sql> =
    sql`SELECT content_hash FROM review_deck_versions WHERE deck_id = $1::text AND version = $2::text LIMIT 1`

/** Stores a deck version; no row comes back when the version exists ($1 deck, $2 version, $3 hash, $4 source hashes, $5 now). */
export const INSERT_DECK_VERSION: ReturnType<typeof sql> = sql`INSERT INTO review_deck_versions (
    deck_id, version, content_hash, source_hashes, imported_at
) VALUES ($1::text, $2::text, $3::text, $4::jsonb, $5::timestamptz)
ON CONFLICT (deck_id, version) DO NOTHING
RETURNING deck_id`

/**
 * Stores the cards of a deck version from a JSON array of {item_id, sort_index, is_premium, level, langs, front, back}
 * ($1 deck, $2 version, $3 cards).
 */
export const INSERT_CARDS: ReturnType<typeof sql> = sql`INSERT INTO review_cards (
    item_id, version, deck_id, sort_index, is_premium, level, langs, front, back
)
SELECT c.item_id, $2::text, $1::text, c.sort_index, c.is_premium, c.level, c.langs, c.front, c.back
FROM jsonb_to_recordset($3::jsonb) AS c(
    item_id text, sort_index integer, is_premium boolean, level text, langs text, front jsonb, back jsonb
)`

/**
 * Makes a version the live one of its deck ($1 deck, $2 course, $3 sort index, $4 version, $5 difficulty, $6 titles,
 * $7 descriptions, $8 module refs, $9 tracks, $10 card count, $11 free card count, $12 now).
 */
export const UPSERT_DECK: ReturnType<typeof sql> = sql`INSERT INTO review_decks (
    deck_id, course, sort_index, live_version, difficulty, titles, descriptions, module_refs, tracks, card_count,
    free_card_count, updated_at
) VALUES ($1::text, $2::text, $3::int, $4::text, $5::text, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::int,
    $11::int, $12::timestamptz)
ON CONFLICT (deck_id) DO UPDATE SET course = EXCLUDED.course, sort_index = EXCLUDED.sort_index,
    live_version = EXCLUDED.live_version, difficulty = EXCLUDED.difficulty, titles = EXCLUDED.titles,
    descriptions = EXCLUDED.descriptions, module_refs = EXCLUDED.module_refs, tracks = EXCLUDED.tracks,
    card_count = EXCLUDED.card_count, free_card_count = EXCLUDED.free_card_count, updated_at = EXCLUDED.updated_at`

/** Reads the daily goal of a learner ($1 learner). */
export const SELECT_GOAL: ReturnType<typeof sql> =
    sql`SELECT daily_goal FROM review_settings WHERE learner_id = $1::uuid LIMIT 1`

/** Stores the daily goal of a learner ($1 learner, $2 goal, $3 now). */
export const UPSERT_GOAL: ReturnType<typeof sql> = sql`INSERT INTO review_settings (learner_id, daily_goal, updated_at)
VALUES ($1::uuid, $2::int, $3::timestamptz)
ON CONFLICT (learner_id) DO UPDATE SET daily_goal = EXCLUDED.daily_goal, updated_at = EXCLUDED.updated_at`

/**
 * Lists the items a learner can still review (new, learning and review), oldest due first, with what the list shows
 * ($1 learner, $2 row bound).
 */
export const SELECT_QUEUE: ReturnType<typeof sql> = sql`SELECT s.item_id, s.source, s.status, s.step::int AS step,
    s.due_on::text AS due_on, s.deck_id, s.lesson_id, s.activity_id, s.lesson_version, s.last_revision,
    s.flipped_revision, c.is_premium, c.level, d.titles AS deck_titles
FROM review_states s
LEFT JOIN review_decks d ON d.deck_id = s.deck_id
LEFT JOIN review_cards c ON c.item_id = s.item_id AND c.version = d.live_version
WHERE s.learner_id = $1::uuid AND s.status IN ('new', 'learning', 'review')
    AND (s.source = 'retrieval' OR c.item_id IS NOT NULL)
ORDER BY s.due_on, s.updated_at, d.sort_index, c.sort_index, s.item_id
LIMIT $2::int`

/** Counts the reviews a learner stored on a day ($1 learner, $2 day). */
export const COUNT_REVIEWS_ON: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS total FROM review_reviews WHERE learner_id = $1::uuid AND answered_on = $2::date`

/** Counts the items still due on or before a day that the learner can review ($1 learner, $2 day, $3 premium). */
export const COUNT_REMAINING_DUE: ReturnType<typeof sql> = sql`SELECT count(*)::int AS total
FROM review_states s
LEFT JOIN review_decks d ON d.deck_id = s.deck_id
LEFT JOIN review_cards c ON c.item_id = s.item_id AND c.version = d.live_version
WHERE s.learner_id = $1::uuid AND s.status IN ('learning', 'review') AND s.due_on <= $2::date
    AND (s.source = 'retrieval' OR c.item_id IS NOT NULL)
    AND ($3::boolean OR (s.source = 'flashcard' AND c.is_premium = false))`

/** Reads the state of an item and locks it ($1 learner, $2 item). */
export const SELECT_STATE_LOCKED: ReturnType<typeof sql> = sql`SELECT item_id, source, status, step::int AS step,
    due_on::text AS due_on, deck_id, lesson_id, activity_id, lesson_version, last_revision, flipped_revision
FROM review_states WHERE learner_id = $1::uuid AND item_id = $2::text
FOR UPDATE`

/** Reads the state of an item ($1 learner, $2 item). */
export const SELECT_STATE: ReturnType<typeof sql> = sql`SELECT item_id, source, status, step::int AS step,
    due_on::text AS due_on, deck_id, lesson_id, activity_id, lesson_version, last_revision, flipped_revision
FROM review_states WHERE learner_id = $1::uuid AND item_id = $2::text`

/** Reads a card of the live version of its deck ($1 item). */
export const SELECT_CARD: ReturnType<typeof sql> =
    sql`SELECT c.item_id, c.deck_id, c.is_premium, c.level, c.langs, c.front,
    c.back, d.titles AS deck_titles
FROM review_cards c
JOIN review_decks d ON d.deck_id = c.deck_id AND d.live_version = c.version
WHERE c.item_id = $1::text
LIMIT 1`

/** Marks the answer of the next revision as revealed; no row comes back when the revision is not the next one ($1 learner, $2 item, $3 revision). */
export const MARK_FLIPPED: ReturnType<typeof sql> = sql`WITH flipped AS (
    UPDATE review_states SET flipped_revision = $3::int
    WHERE learner_id = $1::uuid AND item_id = $2::text AND last_revision = $3::int - 1
    RETURNING item_id
)
SELECT item_id FROM flipped`

/** Stores the written answer of a retrieval item once per revision ($1 learner, $2 item, $3 revision, $4 text, $5 now). */
export const INSERT_ANSWER: ReturnType<typeof sql> = sql`INSERT INTO review_answers (
    learner_id, item_id, revision, answer_text, submitted_at
) VALUES ($1::uuid, $2::text, $3::int, $4::text, $5::timestamptz)
ON CONFLICT (learner_id, item_id, revision) DO NOTHING`

/** Reads the stored review of a revision ($1 learner, $2 item, $3 revision). */
export const SELECT_REVIEW: ReturnType<typeof sql> = sql`SELECT grade FROM review_reviews
WHERE learner_id = $1::uuid AND item_id = $2::text AND revision = $3::int
LIMIT 1`

/** Stores a review ($1 learner, $2 item, $3 revision, $4 grade, $5 cloze correct, $6 now, $7 day). */
export const INSERT_REVIEW: ReturnType<typeof sql> = sql`INSERT INTO review_reviews (
    learner_id, item_id, revision, grade, cloze_correct, answered_at, answered_on
) VALUES ($1::uuid, $2::text, $3::int, $4::text, $5::boolean, $6::timestamptz, $7::date)`

/** Moves an item to its new schedule ($1 learner, $2 item, $3 status, $4 step, $5 due day, $6 revision, $7 now). */
export const UPDATE_STATE: ReturnType<typeof sql> = sql`UPDATE review_states SET status = $3::text, step = $4::smallint,
    due_on = $5::date, last_revision = $6::int, updated_at = $7::timestamptz
WHERE learner_id = $1::uuid AND item_id = $2::text`

/** Lists the decks with whether the learner added each ($1 learner, $2 track or null, $3 row bound). */
export const SELECT_DECKS: ReturnType<typeof sql> =
    sql`SELECT d.deck_id, d.course, d.titles, d.descriptions, d.difficulty,
    d.card_count, d.free_card_count, d.tracks, COALESCE(l.active, false) AS added
FROM review_decks d
LEFT JOIN review_learner_decks l ON l.deck_id = d.deck_id AND l.learner_id = $1::uuid
WHERE $2::text IS NULL OR d.tracks @> jsonb_build_array($2::text)
ORDER BY d.course, d.sort_index
LIMIT $3::int`

/** Checks that a deck exists ($1 deck). */
export const SELECT_DECK_EXISTS: ReturnType<typeof sql> =
    sql`SELECT count(*)::int AS total FROM review_decks WHERE deck_id = $1::text`

/** Brings back the items a removed deck suspended ($1 learner, $2 deck, $3 now). */
export const RESTORE_DECK_STATES: ReturnType<typeof sql> = sql`UPDATE review_states
SET status = COALESCE(suspended_from, 'new'), suspended_from = NULL, updated_at = $3::timestamptz
WHERE learner_id = $1::uuid AND deck_id = $2::text AND status = 'suspended'`

/** Gives the learner the cards of a deck that they do not hold yet, due today ($1 learner, $2 deck, $3 today, $4 now). */
export const INSERT_DECK_STATES: ReturnType<typeof sql> = sql`INSERT INTO review_states (
    learner_id, item_id, source, status, step, due_on, added_by, deck_id, last_revision, flipped_revision, created_at,
    updated_at
)
SELECT $1::uuid, c.item_id, 'flashcard', 'new', -1, $3::date, 'deck', c.deck_id, 0, 0, $4::timestamptz, $4::timestamptz
FROM review_cards c
JOIN review_decks d ON d.deck_id = c.deck_id AND d.live_version = c.version
WHERE d.deck_id = $2::text
ORDER BY c.sort_index
ON CONFLICT (learner_id, item_id) DO NOTHING
RETURNING item_id`

/** Marks a deck as added or removed by the learner ($1 learner, $2 deck, $3 active, $4 now). */
export const UPSERT_LEARNER_DECK: ReturnType<typeof sql> = sql`INSERT INTO review_learner_decks (
    learner_id, deck_id, active, added_at
) VALUES ($1::uuid, $2::text, $3::boolean, $4::timestamptz)
ON CONFLICT (learner_id, deck_id) DO UPDATE SET active = EXCLUDED.active`

/** Suspends the items of a removed deck and keeps their status for later ($1 learner, $2 deck, $3 now). */
export const SUSPEND_DECK_STATES: ReturnType<typeof sql> = sql`WITH suspended AS (
    UPDATE review_states
    SET suspended_from = status, status = 'suspended', updated_at = $3::timestamptz
    WHERE learner_id = $1::uuid AND deck_id = $2::text AND status <> 'suspended'
    RETURNING item_id
)
SELECT item_id FROM suspended`

/** Gives the learner the retrieval item of a finished lesson, due after its days ($1 learner, $2 item, $3 lesson, $4 activity, $5 version, $6 days, $7 due day, $8 now). */
export const INSERT_RETRIEVAL_STATE: ReturnType<typeof sql> = sql`INSERT INTO review_states (
    learner_id, item_id, source, status, step, due_on, added_by, lesson_id, activity_id, lesson_version, after_days,
    last_revision, flipped_revision, created_at, updated_at
) VALUES ($1::uuid, $2::text, 'retrieval', 'learning', 0, $7::date, 'lesson', $3::text, $4::text, $5::text, $6::int, 0, 0,
    $8::timestamptz, $8::timestamptz)
ON CONFLICT (learner_id, item_id) DO NOTHING
RETURNING item_id`

/** Lists the activities of a lesson version the learner has graded attempts for ($1 learner, $2 lesson, $3 version, $4 row bound). */
export const SELECT_GRADED_ACTIVITIES: ReturnType<typeof sql> = sql`SELECT DISTINCT activity_id
FROM lesson_attempts
WHERE learner_id = $1::uuid AND lesson_id = $2::text AND lesson_version = $3::text AND status = 'graded'
LIMIT $4::int`

/** Counts the days with a review since a day ($1 learner, $2 since). */
export const COUNT_ACTIVE_DAYS: ReturnType<typeof sql> = sql`SELECT count(DISTINCT answered_on)::int AS total
FROM review_reviews WHERE learner_id = $1::uuid AND answered_on >= $2::date`

/** Counts the first three reviews of each item and those graded good or easy ($1 learner). */
export const SELECT_RECALL: ReturnType<typeof sql> = sql`SELECT n::int AS n, count(*)::int AS total,
    (count(*) FILTER (WHERE grade IN ('good', 'easy')))::int AS recalled
FROM (
    SELECT grade, row_number() OVER (PARTITION BY item_id ORDER BY revision) AS n
    FROM review_reviews WHERE learner_id = $1::uuid
) numbered
WHERE n <= 3
GROUP BY n
ORDER BY n
LIMIT 3`

/**
 * Claims the due notice of a day: a row comes back only the first time for that day ($1 learner, $2 day, $3 default goal,
 * $4 now).
 */
export const CLAIM_DUE_NOTICE: ReturnType<typeof sql> =
    sql`INSERT INTO review_settings (learner_id, daily_goal, updated_at, due_notified_on)
VALUES ($1::uuid, $3::int, $4::timestamptz, $2::date)
ON CONFLICT (learner_id) DO UPDATE SET due_notified_on = EXCLUDED.due_notified_on
WHERE review_settings.due_notified_on IS DISTINCT FROM EXCLUDED.due_notified_on
RETURNING learner_id`
