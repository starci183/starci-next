import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectSummaryType } from "./project-summary.type"
import { ProjectMilestoneSummaryType } from "./project-milestone-summary.type"
import { ProjectConceptType } from "./project-concept.type"

@ObjectType()
/** One milestone of a project with its concept checklist. */
export class ProjectMilestoneType {
    /** The project, in short. */
    @Field(() => ProjectSummaryType)
    project!: ProjectSummaryType

    /** The milestone. */
    @Field(() => ProjectMilestoneSummaryType)
    milestone!: ProjectMilestoneSummaryType

    /** The concepts in order. */
    @Field(() => [ProjectConceptType])
    concepts!: ReadonlyArray<ProjectConceptType>
}
