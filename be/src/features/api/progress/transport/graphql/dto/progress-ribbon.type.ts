import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The ribbon on top of the progress page. */
export class ProgressRibbonType {
    /** Concepts proved in Projects. */
    @Field(() => Int)
    provedConcepts!: number

    /** The current streak. */
    @Field(() => Int)
    streak!: number

    /** Lessons finished. */
    @Field(() => Int)
    lessonsDone!: number

    /** Harness builds with every stage proved. */
    @Field(() => Int)
    buildsDone!: number
}
