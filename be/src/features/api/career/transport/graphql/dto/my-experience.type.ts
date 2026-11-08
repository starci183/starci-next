import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ExperienceItemType } from "./experience-item.type"

@ObjectType()
/** The experience items of a learner. */
export class MyExperienceType {
    /** The items, newest change first. */
    @Field(() => [ExperienceItemType])
    items!: ReadonlyArray<ExperienceItemType>

    /** Verified items that open the hiring bridge. */
    @Field(() => Int)
    hiringMinVerified!: number
}
