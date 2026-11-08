import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProjectMilestoneSummaryType } from "./project-milestone-summary.type"
import { ProjectCiRunType } from "./project-ci-run.type"
import { ProjectProbeRunType } from "./project-probe-run.type"

@ObjectType()
/** One project with its milestones, practice and proof. */
export class ProjectDetailType {
    /** The project id. */
    @Field(() => String)
    id!: string

    /** The name. */
    @Field(() => String)
    name!: string

    /** app or agent. */
    @Field(() => String)
    kind!: string

    /** The topic. */
    @Field(() => String)
    topic!: string

    /** The main language. */
    @Field(() => String)
    language!: string

    /** The stack line. */
    @Field(() => String)
    stack!: string

    /** The agent tool track of an agent project. */
    @Field(() => String, { nullable: true })
    track!: string | null

    /** The repository address. */
    @Field(() => String, { nullable: true })
    repoUrl!: string | null

    /** The deployed address StarCi probes. */
    @Field(() => String, { nullable: true })
    deployedUrl!: string | null

    /** How many milestone concepts are proved in this project. */
    @Field(() => Int)
    provedConceptCount!: number

    /** How many concepts its milestones list that have a lesson. */
    @Field(() => Int)
    conceptCount!: number

    /** The milestone being worked on. */
    @Field(() => String, { nullable: true })
    currentMilestoneId!: string | null

    /** How many milestones are done. */
    @Field(() => Int)
    doneMilestoneCount!: number

    /** How many milestones the project lists. */
    @Field(() => Int)
    milestoneCount!: number

    /** When it was created, as an ISO 8601 instant. */
    @Field(() => String)
    createdAt!: string

    /** The milestones in order. */
    @Field(() => [ProjectMilestoneSummaryType])
    milestones!: ReadonlyArray<ProjectMilestoneSummaryType>

    /** How many concepts show results from the machine only. */
    @Field(() => Int)
    practisingConceptCount!: number

    /** The last signed CI run. */
    @Field(() => ProjectCiRunType, { nullable: true })
    lastCiRun!: ProjectCiRunType | null

    /** The last probe run. */
    @Field(() => ProjectProbeRunType, { nullable: true })
    lastProbeRun!: ProjectProbeRunType | null
}
