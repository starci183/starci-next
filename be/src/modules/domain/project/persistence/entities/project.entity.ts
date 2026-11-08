import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity("projects")
/** One project of a learner: any topic, language and structure, of kind app or agent, with the secret that signs its CI results. */
export class ProjectEntity {
    /** The project id. */
    @PrimaryColumn({ name: "project_id", type: "uuid" })
    projectId!: string

    /** The owner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The name the learner gave it. */
    @Column({ name: "name", type: "text" })
    name!: string

    /** `app` or `agent`. */
    @Column({ name: "kind", type: "varchar", length: 8 })
    kind!: string

    /** The topic, free text. */
    @Column({ name: "topic", type: "text" })
    topic!: string

    /** The main language. */
    @Column({ name: "language", type: "text" })
    language!: string

    /** The stack line, free text. */
    @Column({ name: "stack", type: "text" })
    stack!: string

    /** The agent tool track of an agent project, else null. */
    @Column({ name: "track", type: "varchar", length: 16, nullable: true })
    track!: string | null

    /** The repository address, else null. */
    @Column({ name: "repo_url", type: "text", nullable: true })
    repoUrl!: string | null

    /** The deployed address StarCi probes, else null. */
    @Column({ name: "deployed_url", type: "text", nullable: true })
    deployedUrl!: string | null

    /** The per-project secret the CI action signs its result with. */
    @Column({ name: "ci_secret", type: "text" })
    ciSecret!: string

    /** The GitHub repository (`owner/name`) the attested CI runs must come from, or null while none is bound. */
    @Column({ name: "github_repository", type: "text", nullable: true })
    githubRepository!: string | null

    /** GitHub's id of that repository, recorded from the first attested run, or null. */
    @Column({ name: "github_repository_id", type: "text", nullable: true })
    githubRepositoryId!: string | null

    /** When it was created. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** When it last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
