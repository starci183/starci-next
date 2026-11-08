import { Field, Int, ObjectType } from "@nestjs/graphql"
import { LessonActivityType } from "./lesson-activity.type"

@ObjectType()
/** A section of a lesson; a locked one keeps its title and drops the content. */
export class LessonSectionType {
    /** The folder name. */
    @Field(() => String)
    id!: string

    /** The position. */
    @Field(() => Int)
    sortIndex!: number

    /** The phase. */
    @Field(() => String)
    phase!: string

    /** The title. */
    @Field(() => String)
    title!: string

    /** True when Premium is needed to read the section. */
    @Field(() => Boolean)
    locked!: boolean

    /** The markdown body, or null when locked. */
    @Field(() => String, { nullable: true })
    body!: string | null

    /** The activities, empty when locked. */
    @Field(() => [LessonActivityType])
    activities!: ReadonlyArray<LessonActivityType>
}
