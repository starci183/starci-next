import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The GitHub repository a project is bound to and the audience its CI asks the OIDC token for. */
export class ProjectRepositoryType {
    /** The project. */
    @Field(() => String)
    projectId!: string

    /** The bound repository, `owner/name`, or null while none is bound. */
    @Field(() => String, { nullable: true })
    repository!: string | null

    /** GitHub's id of the repository once an attested run named it, or null. */
    @Field(() => String, { nullable: true })
    repositoryId!: string | null

    /** The audience the workflow requests its GitHub Actions OIDC token for. */
    @Field(() => String)
    audience!: string
}
