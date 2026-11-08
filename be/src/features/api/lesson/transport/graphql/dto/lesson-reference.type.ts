import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A source a lesson cites. */
export class LessonReferenceType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The short name. */
    @Field(() => String)
    label!: string

    /** The address, or null. */
    @Field(() => String, { nullable: true })
    url!: string | null

    /** The citation. */
    @Field(() => String)
    citation!: string
}
