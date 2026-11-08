import { sql } from "@modules/platform/database"

/** Reads one learner's entitlement ($1 learner). */
export const SELECT_ENTITLEMENT: ReturnType<typeof sql> =
    sql`SELECT learner_id, premium_until, updated_at FROM entitlements WHERE learner_id = $1::uuid`

/** Drops one learner's stored entitlement before it is rebuilt from the terms that still stand ($1 learner). */
export const DELETE_ENTITLEMENT: ReturnType<typeof sql> = sql`DELETE FROM entitlements WHERE learner_id = $1::uuid`

/** Ends one learner's entitlement now: the row a rebuild with no standing term leaves ($1 learner, $2 now). */
export const END_ENTITLEMENT: ReturnType<typeof sql> =
    sql`INSERT INTO entitlements (learner_id, premium_until, updated_at) VALUES ($1::uuid, $2::timestamptz, $2::timestamptz)
ON CONFLICT (learner_id) DO UPDATE SET premium_until = EXCLUDED.premium_until, updated_at = EXCLUDED.updated_at
RETURNING learner_id, premium_until, updated_at`

/** Grants one verified term atomically ($1 learner, $2 confirmation, $3 update time, $4 term months). */
export const GRANT_ENTITLEMENT: ReturnType<typeof sql> =
    sql`INSERT INTO entitlements (learner_id, premium_until, updated_at)
VALUES (
    $1::uuid,
    ((date_trunc('month', $2::timestamptz AT TIME ZONE 'UTC') + make_interval(months => $4::int))
      + (least(
          extract(day FROM $2::timestamptz AT TIME ZONE 'UTC')::int,
          extract(day FROM (date_trunc('month', $2::timestamptz AT TIME ZONE 'UTC') + make_interval(months => $4::int) + interval '1 month' - interval '1 day'))::int
      ) - 1) * interval '1 day'
      + (($2::timestamptz AT TIME ZONE 'UTC') - date_trunc('day', $2::timestamptz AT TIME ZONE 'UTC'))) AT TIME ZONE 'UTC',
    $3::timestamptz
)
ON CONFLICT (learner_id) DO UPDATE SET
    premium_until = CASE
        WHEN entitlements.premium_until > $2::timestamptz THEN
            ((date_trunc('month', entitlements.premium_until AT TIME ZONE 'UTC') + make_interval(months => $4::int))
              + (least(
                  extract(day FROM entitlements.premium_until AT TIME ZONE 'UTC')::int,
                  extract(day FROM (date_trunc('month', entitlements.premium_until AT TIME ZONE 'UTC') + make_interval(months => $4::int) + interval '1 month' - interval '1 day'))::int
              ) - 1) * interval '1 day'
              + ((entitlements.premium_until AT TIME ZONE 'UTC') - date_trunc('day', entitlements.premium_until AT TIME ZONE 'UTC'))) AT TIME ZONE 'UTC'
        ELSE EXCLUDED.premium_until
    END,
    updated_at = EXCLUDED.updated_at
RETURNING learner_id, premium_until, updated_at`
