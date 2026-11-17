import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One pattern of the Practice section of the progress page. */
export class ProgressPracticePatternType {
    /** The pattern id. */
    @Field(() => String)
    patternId!: string

    /** The title in the asked locale. */
    @Field(() => String)
    title!: string

    /** Problems accepted. */
    @Field(() => Int)
    acceptedCount!: number

    /** Problems the pattern has. */
    @Field(() => Int)
    problemCount!: number
}
