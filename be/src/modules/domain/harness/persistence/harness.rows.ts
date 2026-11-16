/** One stored content item as the database answers it. */
export interface ContentRow {
    /** The kind. */
    kind: string
    /** The key. */
    content_key: string
    /** The live version. */
    version: string
    /** The hash. */
    content_hash: string
    /** The position. */
    sort_index: number
    /** The record. */
    content: Record<string, unknown>
}

/** The pack of one content item. */
export interface PackRow {
    /** The version. */
    version: string
    /** The tarball. */
    pack: Buffer
    /** Its SHA-256. */
    pack_sha256: string
}

/** The hash of a stored version. */
export interface HashRow {
    /** The hash. */
    content_hash: string
}

/** The project bound to a build. */
export interface BindingRow {
    /** The build. */
    build_id: string
    /** The project. */
    project_id: string
}

/** One attested result as the database answers it. */
export interface ProofRow {
    /** The build. */
    build_id: string
    /** The stage. */
    stage_id: string
    /** The e2e. */
    e2e_id: string
    /** Whether it passed. */
    passed: boolean
    /** The CI run. */
    run_id: string
    /** The commit. */
    commit_sha: string | null
    /** When recorded, ISO. */
    recorded_at: string
}
