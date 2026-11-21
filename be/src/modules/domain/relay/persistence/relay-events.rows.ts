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
    /** What the CLI reported of a lesson scenario result, or null. */
    detail: RelayResultDetail | null
}

/** The lesson facts a scenario result stores in `detail` (SCENARIO-CONTRACT v2 §5). */
export interface RelayResultDetail {
    /** The lesson slug. */
    lessonId?: string
    /** The scenario id. */
    scenarioId?: string
    /** The concepts that had a running test. */
    concepts?: Array<string>
    /** The guards turned off. */
    guardsOff?: Array<string>
    /** The challenge tier of a challenge run. */
    challengeTier?: string
    /** The first invariant message. */
    why?: string
    /** The ledger lines. */
    ledger?: string
    /** What a bug-pack test measured. */
    received?: string
}

/** One newest harness result row. */
export interface RelayHarnessResultRow {
    /** The task id. */
    task_id: string
    /** The check id: a stage, a probe or a trap. */
    check_id: string
    /** The ref: an e2e id or the tool. */
    ref: string | null
    /** Whether it passed. */
    passed: boolean | null
    /** The commit, or null. */
    commit_sha: string | null
    /** When it was stored. */
    created_at: Date
    /** The harness facts of the result, or null. */
    detail: Record<string, unknown> | null
}
