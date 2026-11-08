import { Field, ObjectType } from "@nestjs/graphql"
import { ProjectSummaryType } from "./project-summary.type"

@ObjectType()
/** A project just created or whose CI secret was rotated: the secret is shown this once. */
export class ProjectSecretType {
    /** The project. */
    @Field(() => ProjectSummaryType)
    project!: ProjectSummaryType

    /** The secret that signs CI results; never served again. */
    @Field(() => String)
    ciSecret!: string
}
