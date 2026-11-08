import { Column, Entity, PrimaryColumn } from "typeorm"
import type { PracticeTestSummary } from "../../practice.contracts"

@Entity("practice_submissions")
/** One run or submit of a learner: the source, where the judging stands and the summary of each test. */
export class PracticeSubmissionEntity {
    /** The submission id. */
    @PrimaryColumn({ name: "submission_id", type: "uuid" })
    submissionId!: string

    /** The learner who sent it. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The problem. */
    @Column({ name: "problem_id", type: "text" })
    problemId!: string

    /** The problem version it was judged against. */
    @Column({ name: "problem_version", type: "text" })
    problemVersion!: string

    /** The language. */
    @Column({ name: "language", type: "varchar", length: 16 })
    language!: string

    /** `run` (the example) or `submit` (every test). */
    @Column({ name: "kind", type: "varchar", length: 8 })
    kind!: string

    /** The source code. */
    @Column({ name: "source", type: "text" })
    source!: string

    /** Where the judging stands, or the verdict. */
    @Column({ name: "verdict", type: "varchar", length: 24 })
    verdict!: string

    /** The stable code of an internal error. */
    @Column({ name: "failure_code", type: "varchar", length: 64, nullable: true })
    failureCode!: string | null

    /** The compiler output of a compile error. */
    @Column({ name: "compile_output", type: "text", nullable: true })
    compileOutput!: string | null

    /** The summary of each test. */
    @Column({ name: "tests", type: "jsonb" })
    tests!: ReadonlyArray<PracticeTestSummary>

    /** How many tests passed. */
    @Column({ name: "passed_count", type: "integer" })
    passedCount!: number

    /** How many tests the submission has. */
    @Column({ name: "total_count", type: "integer" })
    totalCount!: number

    /** The slowest test time in milliseconds. */
    @Column({ name: "time_ms", type: "integer", nullable: true })
    timeMs!: number | null

    /** The highest memory in kilobytes. */
    @Column({ name: "memory_kb", type: "integer", nullable: true })
    memoryKb!: number | null

    /** When it was sent. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When the row last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date

    /** When the judging finished. */
    @Column({ name: "finished_at", type: "timestamptz", nullable: true })
    finishedAt!: Date | null
}
