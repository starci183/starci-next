import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A milestone in the catalog. */
export class ProjectCatalogMilestoneType {
    /** The milestone id. */
    @Field(() => String)
    id!: string

    /** The title in the locale of the request. */
    @Field(() => String)
    title!: string

    /** The concept ids in order. */
    @Field(() => [String])
    concepts!: ReadonlyArray<string>

    /** Whether a learner without Premium may open it. */
    @Field(() => Boolean)
    free!: boolean
}
