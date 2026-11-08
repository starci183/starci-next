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
