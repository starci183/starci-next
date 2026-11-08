import { Column, Entity, PrimaryColumn } from "typeorm"
import type {
    PracticeContent,
    PracticeExample,
    PracticeSolutions,
    PracticeStarterCodes,
    PracticeTest,
} from "../../practice.contracts"

@Entity("practice_problem_versions")
/** One immutable version of a problem: its public text, starter codes and examples, and the hidden tests and solutions that never leave the server. */
export class PracticeProblemVersionEntity {
    /** The problem id, its slug. */
    @PrimaryColumn({ name: "problem_id", type: "text" })
    problemId!: string

    /** The version label, the git sha the import ran with. */
    @PrimaryColumn({ name: "version", type: "text" })
    version!: string

    /** The SHA-256 over the source files. */
    @Column({ name: "content_hash", type: "text" })
    contentHash!: string

    /** `published` for the one live version, `superseded` for the older ones. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The pattern the problem trains. */
    @Column({ name: "pattern_id", type: "text" })
    patternId!: string

    /** The position inside the pattern. */
    @Column({ name: "order_index", type: "integer" })
    orderIndex!: number

    /** `easy`, `medium` or `hard`. */
    @Column({ name: "difficulty", type: "varchar", length: 16 })
    difficulty!: string

    /** The tags. */
    @Column({ name: "tags", type: "jsonb" })
    tags!: ReadonlyArray<string>

    /** The CPU time limit of a test in milliseconds. */
    @Column({ name: "time_limit_ms", type: "integer" })
    timeLimitMs!: number

    /** The memory limit of a test in kilobytes. */
    @Column({ name: "memory_limit_kb", type: "integer" })
    memoryLimitKb!: number

    /** The title by locale. */
    @Column({ name: "titles", type: "jsonb" })
    titles!: Readonly<Record<string, string>>

    /** The statement and the hint ladder by locale. */
    @Column({ name: "content", type: "jsonb" })
    content!: PracticeContent

    /** The starter code of each language. */
    @Column({ name: "starter_codes", type: "jsonb" })
    starterCodes!: PracticeStarterCodes

    /** The public examples. */
    @Column({ name: "examples", type: "jsonb" })
    examples!: ReadonlyArray<PracticeExample>

    /** The hidden tests; never leave the server. */
    @Column({ name: "tests", type: "jsonb" })
    tests!: ReadonlyArray<PracticeTest>

    /** The reference solutions; never leave the server. */
    @Column({ name: "solutions", type: "jsonb" })
    solutions!: PracticeSolutions

    /** The SHA-256 of every source file. */
    @Column({ name: "source_hashes", type: "jsonb" })
    sourceHashes!: Readonly<Record<string, string>>

    /** When the version was imported. */
    @Column({ name: "imported_at", type: "timestamptz" })
    importedAt!: Date
}
