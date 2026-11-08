import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The last signed CI run of a project. */
export class ProjectCiRunType {
    /** The run id. */
    @Field(() => String)
    runId!: string

    /** The commit, shortened. */
    @Field(() => String)
    commit!: string

    /** Whether the whole run passed. */
    @Field(() => Boolean)
    passed!: boolean

    /** When it was received, as an ISO 8601 instant. */
    @Field(() => String)
    at!: string
}
