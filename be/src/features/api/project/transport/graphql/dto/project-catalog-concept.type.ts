import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A concept in the catalog. */
export class ProjectCatalogConceptType {
    /** The concept id. */
    @Field(() => String)
    id!: string

    /** The label in the locale of the request. */
    @Field(() => String)
    label!: string

    /** behaviour or structure. */
    @Field(() => String)
    kind!: string

    /** The slots it needs: every group, any one of the group's slots. */
    @Field(() => [[String]])
    requires!: ReadonlyArray<ReadonlyArray<string>>

    /** The probes it uses. */
    @Field(() => [String])
    probes!: ReadonlyArray<string>

    /** True while the lesson is being written. */
    @Field(() => Boolean)
    comingSoon!: boolean
}
