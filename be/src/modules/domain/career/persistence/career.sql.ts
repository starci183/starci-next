import { sql } from "@modules/platform/database"

/**
 * Creates an item with a fresh public code (three groups of four hex digits); no row comes back when the learner already has
 * an open item of that type and subject ($1 learner, $2 item type, $3 part, $4 subject, $5 project, $6 evidence, $7 slot
 * values, $8 grade, $9 draft line, $10 state, $11 now).
 */
export const INSERT_ITEM: ReturnType<typeof sql> = sql`INSERT INTO career_experience_items (
    verification_code, learner_id, item_type, part, subject, project_id, evidence, slot_values, grade, draft_line, state,
    created_at, updated_at
)
SELECT upper(substr(h, 1, 4) || '-' || substr(h, 5, 4) || '-' || substr(h, 9, 4)), $1::uuid, $2::text, $3::text, $4::text,
    $5::text, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::text, $11::timestamptz, $11::timestamptz
FROM (SELECT md5(gen_random_uuid()::text) AS h) AS code
ON CONFLICT (learner_id, item_type, subject) WHERE state <> 'revoked' DO NOTHING
RETURNING *`

/** Locks the open item of a learner, type and subject ($1 learner, $2 item type, $3 subject). */
export const SELECT_OPEN_ITEM_FOR_UPDATE: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE learner_id = $1::uuid AND item_type = $2::text AND subject = $3::text AND state <> 'revoked'
LIMIT 1
FOR UPDATE`

/** Locks one item ($1 item). */
export const SELECT_ITEM_FOR_UPDATE: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE item_id = $1::uuid
LIMIT 1
FOR UPDATE`

/**
 * Stores new evidence and its grade on an item the learner still works on; no row comes back when it is pending, verified or
 * revoked, whose evidence is frozen ($1 item, $2 evidence, $3 slot values, $4 grade, $5 draft line, $6 state, $7 now).
 */
export const REGRADE_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET evidence = $2::jsonb, slot_values = $3::jsonb, grade = $4::jsonb,
        draft_line = $5::jsonb, state = $6::text, evidence_revision = evidence_revision + 1, revision = revision + 1,
        updated_at = $7::timestamptz
    WHERE item_id = $1::uuid AND state IN ('practising', 'ai-graded', 'returned')
    RETURNING *
)
SELECT * FROM changed`

/**
 * Puts an item in pending review with its line, assignee and deadline; no row comes back when it changed since it was read
 * ($1 item, $2 revision read, $3 line, $4 assignee, $5 teacher only, $6 now, $7 due).
 */
export const SUBMIT_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET line = $3::jsonb, state = 'pending-review', assignee_id = $4::uuid,
        teacher_only = $5::boolean, submitted_at = $6::timestamptz, due_at = $7::timestamptz, revision = revision + 1,
        updated_at = $6::timestamptz
    WHERE item_id = $1::uuid AND revision = $2::int AND state IN ('ai-graded', 'returned')
    RETURNING *
)
SELECT * FROM changed`

/** Shows or hides a verified item of a learner on the public profile ($1 learner, $2 item, $3 shown, $4 now). */
export const SHOW_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET shown_publicly = $3::boolean, updated_at = $4::timestamptz
    WHERE learner_id = $1::uuid AND item_id = $2::uuid AND state = 'verified'
    RETURNING *
)
SELECT * FROM changed`

/** Signs a pending item; no row comes back when another signer decided it first ($1 item, $2 revision, $3 signer, $4 role, $5 now). */
export const APPROVE_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET state = 'verified', signer_id = $3::uuid, signer_role = $4::text,
        signed_at = $5::timestamptz, due_at = NULL, revision = revision + 1, updated_at = $5::timestamptz
    WHERE item_id = $1::uuid AND revision = $2::int AND state = 'pending-review'
    RETURNING *
)
SELECT * FROM changed`

/** Returns a pending item with its note; no row comes back when another signer decided it first ($1 item, $2 revision, $3 note, $4 now). */
export const RETURN_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET state = 'returned', return_note = $3::text, return_count = return_count + 1,
        returned_line = line, returned_evidence_revision = evidence_revision, due_at = NULL, revision = revision + 1,
        updated_at = $4::timestamptz
    WHERE item_id = $1::uuid AND revision = $2::int AND state = 'pending-review'
    RETURNING *
)
SELECT * FROM changed`

/** Revokes a verified item and takes it off the public profile ($1 item, $2 revision, $3 now). */
export const REVOKE_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET state = 'revoked', revoked_at = $3::timestamptz, shown_publicly = false,
        revision = revision + 1, updated_at = $3::timestamptz
    WHERE item_id = $1::uuid AND revision = $2::int AND state = 'verified'
    RETURNING *
)
SELECT * FROM changed`

/** Assigns a pending item to a reviewer, or to the teacher's queue with null ($1 item, $2 revision, $3 assignee, $4 now). */
export const ASSIGN_ITEM: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_experience_items SET assignee_id = $3::uuid, revision = revision + 1, updated_at = $4::timestamptz
    WHERE item_id = $1::uuid AND revision = $2::int AND state = 'pending-review'
    RETURNING *
)
SELECT * FROM changed`

/** Moves every assigned item past its deadline to the teacher's queue, a bounded batch at a time ($1 now, $2 limit). */
export const ESCALATE_OVERDUE: ReturnType<typeof sql> = sql`WITH due AS (
    SELECT item_id FROM career_experience_items
    WHERE state = 'pending-review' AND due_at <= $1::timestamptz AND teacher_only = false
    ORDER BY due_at
    LIMIT $2::int
    FOR UPDATE SKIP LOCKED
), changed AS (
    UPDATE career_experience_items AS i SET assignee_id = NULL, teacher_only = true, revision = i.revision + 1,
        updated_at = $1::timestamptz
    FROM due WHERE i.item_id = due.item_id
    RETURNING i.*
)
SELECT * FROM changed`

/** Appends one row to the audit trail ($1 item, $2 action, $3 actor, $4 role, $5 from, $6 to, $7 note, $8 snapshot, $9 at). */
export const INSERT_DECISION: ReturnType<typeof sql> = sql`INSERT INTO career_review_decisions (
    item_id, action, actor_id, actor_role, from_state, to_state, note, snapshot, at
) VALUES ($1::uuid, $2::text, $3::uuid, $4::text, $5::text, $6::text, $7::text, $8::jsonb, $9::timestamptz)
RETURNING decision_id`

/** The items of a learner, newest change first, optionally of one state ($1 learner, $2 state or null, $3 limit). */
export const SELECT_LEARNER_ITEMS: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE learner_id = $1::uuid AND ($2::text IS NULL OR state = $2::text)
ORDER BY updated_at DESC, item_id DESC
LIMIT $3::int`

/** One item of a learner ($1 learner, $2 item). */
export const SELECT_LEARNER_ITEM: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE learner_id = $1::uuid AND item_id = $2::uuid
LIMIT 1`

/** One item ($1 item). */
export const SELECT_ITEM: ReturnType<typeof sql> =
    sql`SELECT * FROM career_experience_items WHERE item_id = $1::uuid LIMIT 1`

/**
 * The pending items a signer sees, oldest due first: every pending item for the teacher ($2 null), else the items assigned to
 * the reviewer ($1 limit, $2 reviewer or null).
 */
export const SELECT_PENDING_ITEMS: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE state = 'pending-review' AND ($2::uuid IS NULL OR assignee_id = $2::uuid)
ORDER BY due_at, item_id
LIMIT $1::int`

/** The audit trail of an item, oldest first ($1 item, $2 limit). */
export const SELECT_DECISIONS: ReturnType<typeof sql> = sql`SELECT action, actor_role, from_state, to_state, note, at
FROM career_review_decisions
WHERE item_id = $1::uuid
ORDER BY at, decision_id
LIMIT $2::int`

/** The verified or revoked item of a public code ($1 code). */
export const SELECT_BY_CODE: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE verification_code = $1::text AND state IN ('verified', 'revoked')
LIMIT 1`

/** The verified items of a learner, newest signature first ($1 learner, $2 limit). */
export const SELECT_VERIFIED_ITEMS: ReturnType<typeof sql> = sql`SELECT * FROM career_experience_items
WHERE learner_id = $1::uuid AND state = 'verified'
ORDER BY signed_at DESC, item_id DESC
LIMIT $2::int`

/** The active appointment of a reviewer with the pending items assigned to them ($1 reviewer). */
export const SELECT_ACTIVE_REVIEWER: ReturnType<typeof sql> =
    sql`SELECT r.reviewer_id, r.parts, r.capacity, r.conflicts,
    r.appointed_at, r.ended_at,
    (SELECT count(*)::int FROM career_experience_items i
        WHERE i.assignee_id = r.reviewer_id AND i.state = 'pending-review') AS open_items
FROM career_reviewers r
WHERE r.reviewer_id = $1::uuid AND r.ended_at IS NULL
LIMIT 1`

/** The active appointments, oldest first ($1 limit). */
export const SELECT_REVIEWERS: ReturnType<typeof sql> = sql`SELECT r.reviewer_id, r.parts, r.capacity, r.conflicts,
    r.appointed_at, r.ended_at,
    (SELECT count(*)::int FROM career_experience_items i
        WHERE i.assignee_id = r.reviewer_id AND i.state = 'pending-review') AS open_items
FROM career_reviewers r
WHERE r.ended_at IS NULL
ORDER BY r.appointed_at, r.appointment_id
LIMIT $1::int`

/**
 * The active reviewer with the fewest open items whose parts cover the part, who is not the learner, has no conflict with them
 * and has spare capacity ($1 part, $2 learner).
 */
export const PICK_REVIEWER: ReturnType<typeof sql> = sql`SELECT r.reviewer_id
FROM career_reviewers r
LEFT JOIN LATERAL (
    SELECT count(*)::int AS open_items FROM career_experience_items i
    WHERE i.assignee_id = r.reviewer_id AND i.state = 'pending-review'
) AS load ON true
WHERE r.ended_at IS NULL AND r.parts @> jsonb_build_array($1::text) AND r.reviewer_id <> $2::uuid AND NOT (r.conflicts @> jsonb_build_array($2::text))
    AND load.open_items < r.capacity
ORDER BY load.open_items, r.appointed_at
LIMIT 1`

/** Ends the active appointment of a reviewer ($1 reviewer, $2 now). */
export const END_REVIEWER: ReturnType<typeof sql> = sql`WITH changed AS (
    UPDATE career_reviewers SET ended_at = $2::timestamptz
    WHERE reviewer_id = $1::uuid AND ended_at IS NULL
    RETURNING reviewer_id, parts, capacity, conflicts, appointed_at, ended_at
)
SELECT reviewer_id, parts, capacity, conflicts, appointed_at, ended_at, 0 AS open_items FROM changed`

/** Appoints a reviewer ($1 reviewer, $2 parts, $3 capacity, $4 conflicts, $5 teacher, $6 now). */
export const INSERT_REVIEWER: ReturnType<typeof sql> = sql`INSERT INTO career_reviewers (
    reviewer_id, parts, capacity, conflicts, appointed_by, appointed_at
) VALUES ($1::uuid, $2::jsonb, $3::int, $4::jsonb, $5::uuid, $6::timestamptz)
RETURNING reviewer_id, parts, capacity, conflicts, appointed_at, ended_at, 0 AS open_items`
