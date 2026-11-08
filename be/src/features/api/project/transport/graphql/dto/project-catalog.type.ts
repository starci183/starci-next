import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProjectCatalogMilestoneType } from "./project-catalog-milestone.type"
import { ProjectCatalogConceptType } from "./project-catalog-concept.type"

@ObjectType()
/** What the new-project screen and the milestone pickers read. */
export class ProjectCatalogType {
    /** The milestones. */
    @Field(() => [ProjectCatalogMilestoneType])
    milestones!: ReadonlyArray<ProjectCatalogMilestoneType>

    /** The concepts. */
    @Field(() => [ProjectCatalogConceptType])
    concepts!: ReadonlyArray<ProjectCatalogConceptType>

    /** How many projects a learner without Premium may own. */
    @Field(() => Int)
    freeProjects!: number
}
