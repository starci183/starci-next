import { sql } from "@modules/platform/database"

/** Reads one learner's entitlement ($1 learner). */
export const SELECT_ENTITLEMENT = sql`SELECT learner_id, premium_until, updated_at FROM entitlements WHERE learner_id = $1::uuid`

/** Grants one verified term atomically ($1 learner, $2 confirmation, $3 update time, $4 term months). */
export const GRANT_ENTITLEMENT = sql`INSERT INTO entitlements (learner_id, premium_until, updated_at)
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
