import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The project whose GitHub CI proves a build. */
export class HarnessRepositoryType {
    /** Whether a project is bound. */
    @Field(() => Boolean)
    bound!: boolean

    /** The bound project, or null. */
    @Field(() => String, { nullable: true })
    projectId!: string | null
}
