import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("project_evidence")
/** One append-only result for a concept: a tagged test, an e2e flow, a probe or an AI code read, from the machine, CI or the server. */
export class ProjectEvidenceEntity {
    /** The evidence id. */
    @PrimaryColumn({ name: "evidence_id", type: "uuid" })
    evidenceId!: string

    /** The project. */
    @Column({ name: "project_id", type: "uuid" })
    projectId!: string

    /** The concept. */
    @Column({ name: "concept_id", type: "text" })
    conceptId!: string

    /** `test`, `e2e`, `probe` or `code-read`. */
    @Column({ name: "slot", type: "varchar", length: 12 })
    slot!: string

    /** `relay` (practice), `ci` or `server-probe` (proof), `ai`. */
    @Column({ name: "source", type: "varchar", length: 16 })
    source!: string

    /** Whether it passed. */
    @Column({ name: "passed", type: "boolean" })
    passed!: boolean

    /** The test name, the e2e file, the probe id or the code location. */
    @Column({ name: "ref", type: "text" })
    ref!: string

    /** The run it came from; a repeat of the same run adds nothing. */
    @Column({ name: "run_id", type: "text" })
    runId!: string

    /** The commit of the run, else null. */
    @Column({ name: "commit_sha", type: "text", nullable: true })
    commitSha!: string | null

    /** The short facts: a probe's reason, an AI grade with its quotes. */
    @Column({ name: "detail", type: "jsonb" })
    detail!: Readonly<Record<string, unknown>>

    /** When it was produced. */
    @Column({ name: "at", type: "timestamptz" })
    at!: Date
}
