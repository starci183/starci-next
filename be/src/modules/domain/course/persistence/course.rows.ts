/** One stored lab version as the reads return it. */
export interface CourseLabRow {
    /** The version label. */
    version: string
    /** The SHA-256 (hex) of the record. */
    content_hash: string
    /** The record. */
    record: unknown
}

/** The hash a stored version was written with. */
export interface CourseLabHashRow {
    /** The version label. */
    version: string
    /** The SHA-256 (hex) of the record. */
    content_hash: string
}

/** One case mark row. */
export interface CourseCaseMarkRow {
    /** The case id. */
    case_id: string
    /** Hint levels opened. */
    hints_opened: number
    /** Whether the case was ever green. */
    ever_green: boolean
}

/** The newest run of one case. */
export interface CourseCaseRunRow {
    /** The case id. */
    case_id: string
    /** green, red or error. */
    status: "green" | "red" | "error"
    /** When it ran on the machine. */
    ran_at: Date
    /** How long it took, in milliseconds. */
    duration_ms: number
    /** The learner's commit, or null. */
    learner_commit: string | null
    /** Why it failed, or null. */
    failed: { invariant: string | null; message: string; expected?: string; actual?: string } | null
}

/** One stored course version as the reads return it. */
export interface CourseCourseRow {
    /** The course id. */
    course_id: string
    /** The version label. */
    version: string
    /** The SHA-256 (hex) of the record. */
    content_hash: string
    /** The record. */
    record: unknown
}

/** The hash a stored course version was written with. */
export interface CourseCourseHashRow {
    /** The course id. */
    course_id: string
    /** The version label. */
    version: string
    /** The SHA-256 (hex) of the record. */
    content_hash: string
}

/** The terms of the live lab record of one lesson. */
export interface CourseLabTermsRow {
    /** The lesson id. */
    lesson_id: string
    /** The record's `allowedTerms`, as stored. */
    allowed_terms: unknown
}
