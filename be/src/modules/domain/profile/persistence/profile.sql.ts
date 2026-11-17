import { sql } from "@modules/platform/database"

/** Reads the profile of a learner ($1 learner). */
export const SELECT_PROFILE: ReturnType<typeof sql> =
    sql`SELECT display_name, avatar_key, avatar_content_type, avatar_size,
    to_char(avatar_updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS avatar_updated_at
FROM profile_learners WHERE learner_id = $1::uuid`

/** Sets the display name, or clears it with null ($1 learner, $2 name, $3 now). */
export const UPSERT_NAME: ReturnType<typeof sql> =
    sql`INSERT INTO profile_learners (learner_id, display_name, updated_at)
VALUES ($1::uuid, $2::text, $3::timestamptz)
ON CONFLICT (learner_id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = EXCLUDED.updated_at`

/** Sets the avatar ($1 learner, $2 key, $3 content type, $4 size, $5 now). */
export const UPSERT_AVATAR: ReturnType<typeof sql> = sql`INSERT INTO profile_learners
    (learner_id, avatar_key, avatar_content_type, avatar_size, avatar_updated_at, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::integer, $5::timestamptz, $5::timestamptz)
ON CONFLICT (learner_id) DO UPDATE SET avatar_key = EXCLUDED.avatar_key, avatar_content_type = EXCLUDED.avatar_content_type,
    avatar_size = EXCLUDED.avatar_size, avatar_updated_at = EXCLUDED.avatar_updated_at, updated_at = EXCLUDED.updated_at`

/** Clears the avatar ($1 learner, $2 now). */
export const CLEAR_AVATAR: ReturnType<typeof sql> =
    sql`UPDATE profile_learners SET avatar_key = NULL, avatar_content_type = NULL,
    avatar_size = NULL, avatar_updated_at = NULL, updated_at = $2::timestamptz WHERE learner_id = $1::uuid`

/** Reads the CV link of a learner ($1 learner). */
export const SELECT_CV: ReturnType<typeof sql> =
    sql`SELECT cv_slug, cv_public, display_name, account_name FROM profile_learners WHERE learner_id = $1::uuid`

/**
 * Gives a learner a CV slug once and remembers the account name; a learner that has a slug keeps it, and a slug another learner
 * holds fails the unique index ($1 learner, $2 slug, $3 account name, $4 now).
 */
export const UPSERT_CV_SLUG: ReturnType<typeof sql> =
    sql`INSERT INTO profile_learners (learner_id, cv_slug, account_name, updated_at)
VALUES ($1::uuid, $2::text, $3::text, $4::timestamptz)
ON CONFLICT (learner_id) DO UPDATE SET cv_slug = COALESCE(profile_learners.cv_slug, EXCLUDED.cv_slug),
    account_name = COALESCE(EXCLUDED.account_name, profile_learners.account_name), updated_at = EXCLUDED.updated_at`

/** Makes the CV of a learner public or private ($1 learner, $2 public, $3 now). */
export const SET_CV_PUBLIC: ReturnType<typeof sql> =
    sql`UPDATE profile_learners SET cv_public = $2::boolean, updated_at = $3::timestamptz WHERE learner_id = $1::uuid`

/** Reads the learner of a public slug; no row when the slug is unknown or the CV is private ($1 slug). */
export const SELECT_PUBLIC_CV: ReturnType<typeof sql> =
    sql`SELECT learner_id, display_name, account_name, avatar_key, cv_slug
FROM profile_learners WHERE cv_slug = $1::text AND cv_public
LIMIT 1`
