import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The setup a session was started with. */
export class InterviewSetupType {
    /** The outcome track. */
    @Field(() => String)
    track!: string

    /** The tier. */
    @Field(() => String)
    tier!: string

    /** The locale. */
    @Field(() => String)
    locale!: string

    /** The code language asked. */
    @Field(() => String, { nullable: true })
    language!: string | null

    /** How many questions. */
    @Field(() => Int)
    length!: number

    /** free or premium. */
    @Field(() => String)
    access!: string
}
