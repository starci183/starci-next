import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** A grading criterion as the learner sees it before a submit: its name and points, never the evidence. */
export class LessonCriterionType {
    /** The stable id. */
    @Field(() => String)
    id!: string

    /** The criterion text. */
    @Field(() => String)
    criterion!: string

    /** The most points. */
    @Field(() => Int)
    maxScore!: number
}
