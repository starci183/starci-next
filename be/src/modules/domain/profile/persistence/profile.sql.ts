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
