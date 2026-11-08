import type { ConceptView, ProjectSummaryView, ProjectView } from "@modules/domain/project"

/** A project as the database answers it. */
export interface ProjectRowFixture {
    project_id: string
    learner_id: string
    name: string
    kind: string
    topic: string
    language: string
    stack: string
    track: string | null
    repo_url: string | null
    deployed_url: string | null
    ci_secret: string
    created_at: Date
    updated_at: Date
}

/** A concept pointer as the database answers it. */
export interface ConceptRowFixture {
    project_id: string
    concept_id: string
    location: string | null
    endpoint: string | null
    sample_body: string | null
}

/** A latest result as the database answers it. */
export interface EvidenceDbRowFixture {
    project_id: string
    concept_id: string
    slot: string
    source: string
    passed: boolean
    ref: string
    run_id: string
    commit_sha: string | null
    detail: Readonly<Record<string, unknown>>
    at: Date
}

/** A latest result as the domain reads it. */
export interface EvidenceFixture {
    projectId: string
    conceptId: string
    slot: "test" | "e2e" | "probe" | "code-read"
    source: "relay" | "ci" | "ci-signed" | "server-probe" | "ai"
    passed: boolean
    ref: string
    runId: string
    commitSha: string | null
    detail: Readonly<Record<string, unknown>>
    at: Date
}

/** A signed CI run as the database answers it. */
export interface CiRunRowFixture {
    project_id: string
    run_id: string
    commit_sha: string
    passed: boolean
    received_at: Date
}

/** A probe run as the database answers it. */
export interface ProbeRunRowFixture {
    project_id: string
    run_id: string
    url: string
    passed: boolean
    results: ReadonlyArray<Readonly<Record<string, unknown>>>
    at: Date
}

/** A check result the relay reported. */
export interface RelayResultFixture {
    eventId: string
    runId: string
    conceptId: string
    slot: "test" | "e2e" | "probe" | "code-read"
    ref: string
    passed: boolean
    commit: string | null
    at: Date
}

/** A learner nobody else uses. */
export const PROJECT_LEARNER = "40000000-0000-4000-8000-000000000001"

/** A project nobody else uses. */
export const PROJECT_ID = "40000000-0000-4000-8000-0000000000a1"

/** The instant specs treat as now. */
export const PROJECT_NOW: Date = new Date("2026-11-08T10:00:00.000Z")

/** A stored project; an app in Go unless the patch says otherwise. */
export const projectRowOf = (patch: Partial<ProjectRowFixture> = {}): ProjectRowFixture => ({
    project_id: PROJECT_ID,
    learner_id: PROJECT_LEARNER,
    name: "Clinic booking",
    kind: "app",
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repo_url: "https://github.com/hocvien/dat-lich",
    deployed_url: "https://dat-lich.example.com",
    ci_secret: "a".repeat(64),
    created_at: new Date("2026-11-01T00:00:00.000Z"),
    updated_at: new Date("2026-11-01T00:00:00.000Z"),
    ...patch,
})

/** A concept pointer. */
export const conceptRowOf = (patch: Partial<ConceptRowFixture> = {}): ConceptRowFixture => ({
    project_id: PROJECT_ID,
    concept_id: "idempotency",
    location: "internal/booking/repo.go#Reserve",
    endpoint: "POST /bookings",
    sample_body: '{"slot":"09:00"}',
    ...patch,
})

/** A result of the evidence as the domain reads it; a passing signed-CI test unless the patch says otherwise. */
export const evidenceOf = (patch: Partial<EvidenceFixture> = {}): EvidenceFixture => ({
    projectId: PROJECT_ID,
    conceptId: "idempotency",
    slot: "test",
    source: "ci",
    passed: true,
    ref: "[idempotency] booking twice with the same key",
    runId: "run-1",
    commitSha: "abc1234def",
    detail: {},
    at: new Date("2026-11-08T09:00:00.000Z"),
    ...patch,
})

/** A result as the database answers it. */
export const evidenceDbRowOf = (patch: Partial<EvidenceDbRowFixture> = {}): EvidenceDbRowFixture => ({
    project_id: PROJECT_ID,
    concept_id: "idempotency",
    slot: "test",
    source: "ci",
    passed: true,
    ref: "[idempotency] booking twice with the same key",
    run_id: "run-1",
    commit_sha: "abc1234def",
    detail: {},
    at: new Date("2026-11-08T09:00:00.000Z"),
    ...patch,
})

/** A signed CI run row. */
export const ciRunRowOf = (patch: Partial<CiRunRowFixture> = {}): CiRunRowFixture => ({
    project_id: PROJECT_ID,
    run_id: "run-1",
    commit_sha: "abc1234def5678",
    passed: true,
    received_at: new Date("2026-11-08T09:00:00.000Z"),
    ...patch,
})

/** A probe run row. */
export const probeRunRowOf = (patch: Partial<ProbeRunRowFixture> = {}): ProbeRunRowFixture => ({
    project_id: PROJECT_ID,
    run_id: "50000000-0000-4000-8000-000000000001",
    url: "https://dat-lich.example.com",
    passed: true,
    results: [{ probeId: "health", conceptId: null, passed: true, reason: "ok", facts: { status: 200 } }],
    at: new Date("2026-11-08T09:30:00.000Z"),
    ...patch,
})

/** A check result the relay reported. */
export const relayResultOf = (patch: Partial<RelayResultFixture> = {}): RelayResultFixture => ({
    eventId: "evt-1",
    runId: "relay-run-1",
    conceptId: "idempotency",
    slot: "test",
    ref: "[idempotency] booking twice with the same key",
    passed: true,
    commit: "abc1234",
    at: new Date("2026-11-08T08:00:00.000Z"),
    ...patch,
})

/** A project in short, as the views answer it. */
export const summaryViewOf = (): ProjectSummaryView => ({
    id: PROJECT_ID,
    name: "Clinic booking",
    kind: "app",
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repoUrl: null,
    deployedUrl: null,
    provedConceptCount: 0,
    conceptCount: 0,
    currentMilestoneId: null,
    doneMilestoneCount: 0,
    milestoneCount: 0,
    createdAt: "2026-11-01T00:00:00.000Z",
})

/** A project with its milestones, as the views answer it. */
export const projectViewOf = (): ProjectView => ({
    ...summaryViewOf(),
    milestones: [],
    practisingConceptCount: 0,
    lastCiRun: null,
    lastProbeRun: null,
})

/** A concept of a milestone, as the views answer it. */
export const conceptViewOf = (): ConceptView => ({
    id: "idempotency",
    label: "Idempotency",
    kind: "behaviour",
    state: "todo",
    comingSoon: false,
    lesson: null,
    location: null,
    endpoint: null,
    sampleBody: null,
    slots: [],
    failing: null,
    aiQuestion: null,
})
