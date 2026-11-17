import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The CV link of a learner. */
export class CvLinkType {
    /** The slug of the link, fixed once it is made. */
    @Field(() => String)
    slug!: string

    /** The path of the public CV on the web app, /cv/<slug>. */
    @Field(() => String)
    path!: string

    /** Whether anyone with the link can open the CV. */
    @Field(() => Boolean)
    isPublic!: boolean

    /** How many verified lines the learner has. */
    @Field(() => Int)
    verifiedCount!: number
}
