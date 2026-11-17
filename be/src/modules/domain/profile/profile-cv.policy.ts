/** The longest slug base in characters, so a link stays short enough to read and share. */
export const CV_SLUG_MAX = 40

/** The slug of a learner whose name has no letter or digit that survives ASCII folding. */
export const CV_SLUG_FALLBACK = "learner"

/** The most suffixes tried before the slug gives up on a numeric suffix. */
export const CV_SLUG_ATTEMPTS = 50

/** The path of a public CV on the web app. */
export const cvPathOf = (slug: string): string => `/cv/${slug}`

/** A text with its empty hyphen-separated parts dropped: no hyphen at either end and never two in a row. */
const hyphenated = (text: string): string =>
    text
        .split("-")
        .filter((part) => part !== "")
        .join("-")

/**
 * The slug base of a name: the Latin letters of the name without their marks (the Vietnamese d with a stroke becomes d), lower
 * case, every other run of characters one hyphen, no hyphen at either end and at most `CV_SLUG_MAX` characters. A name with
 * nothing left gives the fallback.
 */
export const cvSlugBaseOf = (name: string): string => {
    const folded = name
        .normalize("NFD")
        .replaceAll(/\p{M}/gu, "")
        .replaceAll("\u0111", "d")
        .replaceAll("\u0110", "D")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/gu, "-")
    const slug = hyphenated(hyphenated(folded).slice(0, CV_SLUG_MAX))
    return slug === "" ? CV_SLUG_FALLBACK : slug
}

/** The slug to try the n-th time: the base itself first, then the base with a numeric suffix starting at 2. */
export const cvSlugCandidateOf = (base: string, attempt: number): string => (attempt <= 1 ? base : `${base}-${attempt}`)

/** Whether a database failure is a violation of a unique constraint (SQLSTATE 23505). */
export const isUniqueViolation = (cause: unknown): boolean => {
    if (typeof cause !== "object" || cause === null) return false
    const direct = "code" in cause ? cause.code : undefined
    const driver = "driverError" in cause ? cause.driverError : undefined
    const nested = typeof driver === "object" && driver !== null && "code" in driver ? driver.code : undefined
    return direct === "23505" || nested === "23505"
}
