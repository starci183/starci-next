/**
 * The only reader of `process.env` in this app. A value is read when it is asked for, not when the file loads, and a
 * missing value stops the caller with a named error: there is no localhost fallback.
 */

const required = (name: string, value: string | undefined): string => {
    if (value === undefined || value === "") throw new Error(`${name} is not set`)
    return value
}

/** The public origin of the app, the base of every absolute metadata URL; throws when `NEXT_PUBLIC_SITE_URL` is not set. */
export const siteUrl = (): string => required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL)

/**
 * True when the evidence page may draw the typed fixtures of the code-read rubric and the CV line. The evidence door that owns both
 * does not answer yet; until it does the page shows an honest empty state, and only a gallery or demo build sets
 * `NEXT_PUBLIC_PROJECTS_EVIDENCE_FIXTURES=1` to see the shapes filled.
 */
export const projectsEvidenceFixtures = (): boolean => process.env.NEXT_PUBLIC_PROJECTS_EVIDENCE_FIXTURES === "1"
