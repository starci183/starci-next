/** One check result row as the project practice read returns it. */
export interface RelayResultRow {
    /** The client event id. */
    event_id: string
    /** The run. */
    run_id: string
    /** The concept. */
    concept_id: string
    /** test, e2e or probe. */
    slot: "test" | "e2e" | "probe"
    /** The test name, e2e file or probe id. */
    ref: string | null
    /** Whether it passed. */
    passed: boolean | null
    /** The commit, or null. */
    commit_sha: string | null
    /** When it was stored. */
    created_at: Date
}

/** The newest started or result event of one check of a task, with the newest log of its run. */
export interface RelayCheckStateRow {
    /** The check id (a scenario id for a lesson task). */
    check_id: string
    /** The kind of the newest event. */
    kind: "check.started" | "check.result"
    /** The run. */
    run_id: string
    /** The slot the CLI tagged (`scenario`, `challenge`), or null. */
    slot: string | null
    /** The ref the CLI tagged (the challenge id of a challenge run), or null. */
    ref: string | null
    /** Whether it passed, for a result. */
    passed: boolean | null
    /** The exit code, for a result. */
    exit_code: number | null
    /** How long it ran, for a result. */
    duration_ms: number | null
    /** The commit, or null. */
    commit_sha: string | null
    /** When it was stored. */
    created_at: Date
    /** The newest log text of the run and check, or null. */
    output: string | null
}
