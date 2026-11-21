import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One opener question: right the first time, right now, and how often answered. */
export class LessonOpenerQuestionScoreType {
    /** The activity id, `opener.<question id>`. */
    @Field(() => String)
    activityId!: string

    /** Whether the first graded answer was right. */
    @Field(() => Boolean)
    firstCorrect!: boolean

    /** Whether the newest graded answer is right. */
    @Field(() => Boolean)
    latestCorrect!: boolean

    /** Whether any graded answer is right: the question is solved. */
    @Field(() => Boolean)
    isSolved!: boolean

    /** The graded answers given. */
    @Field(() => Int)
    attempts!: number
}

@ObjectType()
/** The opener of one lesson: answered, right before, right now. */
export class LessonOpenerScoreType {
    /** The lesson. */
    @Field(() => String)
    lessonId!: string

    /** The questions answered at least once. */
    @Field(() => Int)
    answered!: number

    /** The questions right the first time. */
    @Field(() => Int)
    firstCorrect!: number

    /** The questions right now. */
    @Field(() => Int)
    latestCorrect!: number

    /** The questions picked right at least once. */
    @Field(() => Int)
    solved!: number

    /** True once every question of the opener is solved: the opener is passed. */
    @Field(() => Boolean)
    isPassed!: boolean

    /** Each answered question. */
    @Field(() => [LessonOpenerQuestionScoreType])
    questions!: ReadonlyArray<LessonOpenerQuestionScoreType>
}
