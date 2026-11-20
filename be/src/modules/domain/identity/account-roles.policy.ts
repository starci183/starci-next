import { isRecord } from "@modules/platform/primitives"

/** The roles an account holds: the strings of `roles` in its profile keys (`raw_user_meta_data`); anything else is none. */
export const rolesOf = (meta: unknown): ReadonlyArray<string> =>
    isRecord(meta) && Array.isArray(meta.roles)
        ? meta.roles.filter((role): role is string => typeof role === "string" && role !== "")
        : []
