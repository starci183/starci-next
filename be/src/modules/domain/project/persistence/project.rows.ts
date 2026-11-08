/** One project as the database answers it. */
export interface ProjectRow {
    /** The project id. */
    project_id: string
    /** The owner. */
    learner_id: string
    /** The name. */
    name: string
    /** `app` or `agent`. */
    kind: string
    /** The topic. */
    topic: string
    /** The main language. */
    language: string
    /** The stack line. */
    stack: string
    /** The agent track, or null. */
    track: string | null
    /** The repository address, or null. */
    repo_url: string | null
    /** The deployed address, or null. */
    deployed_url: string | null
    /** The CI secret. */
    ci_secret: string
    /** When it was created. */
    created_at: Date
    /** When it last changed. */
    updated_at: Date
}

/** One concept pointer. */
export interface ConceptRow {
    /** The project. */
    project_id: string
    /** The concept. */
    concept_id: string
    /** The code location, or null. */
    location: string | null
    /** The endpoint, or null. */
    endpoint: string | null
    /** The sample body, or null. */
    sample_body: string | null
}

/** One latest result. */
export interface EvidenceDbRow {
    /** The project. */
    project_id: string
    /** The concept. */
    concept_id: string
    /** The slot. */
    slot: string
    /** The source. */
    source: string
    /** Whether it passed. */
    passed: boolean
    /** The ref. */
    ref: string
    /** The run. */
    run_id: string
    /** The commit, or null. */
    commit_sha: string | null
    /** The facts. */
    detail: Readonly<Record<string, unknown>>
    /** When it was produced. */
    at: Date
}

/** One signed CI run. */
export interface CiRunRow {
    /** The project. */
    project_id: string
    /** The run. */
    run_id: string
    /** The commit. */
    commit_sha: string
    /** Whether it passed. */
    passed: boolean
    /** When it was received. */
    received_at: Date
}

/** One probe run. */
export interface ProbeRunRow {
    /** The project. */
    project_id: string
    /** The run. */
    run_id: string
    /** The address probed. */
    url: string
    /** Whether every probe passed. */
    passed: boolean
    /** The results. */
    results: ReadonlyArray<Readonly<Record<string, unknown>>>
    /** When it ran. */
    at: Date
}

/** One proved concept. */
export interface ProvedConceptRow {
    /** The project. */
    project_id: string
    /** The concept. */
    concept_id: string
    /** When it was first proved. */
    proved_at: Date
}

/** The newest relay result time. */
export interface RelayCursorRow {
    /** The time, or null before any relay result. */
    cursor: Date | null
}

/** A count. */
export interface TotalRow {
    /** The count. */
    total: number
}

/** A claimed subject. */
export interface SubjectRow {
    /** The subject. */
    subject: string
}

/** The GitHub repository a project is bound to. */
export interface RepositoryRow {
    /** The repository, `owner/name`, or null while none is bound. */
    github_repository: string | null
    /** GitHub's id of the repository, or null before the first attested run. */
    github_repository_id: string | null
}
