import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** Where a learner stands in one of the four parts of a lesson. */
export class LessonPartProgressType {
    /** essence, source, scenarios or apply. */
    @Field(() => String)
    part!: string

    /** none, doing, done, or locked when the learner may not read the part (no Premium). */
    @Field(() => String)
    state!: string

    /** What is done: opener questions answered, 1 once the source was pulled, scenarios green, rungs passed. */
    @Field(() => Int)
    done!: number

    /** What there is to do in the part; 0 when the lesson ships none. */
    @Field(() => Int)
    total!: number
}

@ObjectType()
/** The opener before and after. */
export class LessonPartsOpenerType {
    /** The questions answered at least once. */
    @Field(() => Int)
    answered!: number

    /** The questions right the first time. */
    @Field(() => Int)
    firstCorrect!: number

    /** The questions right now. */
    @Field(() => Int)
    latestCorrect!: number
}

@ObjectType()
/** The four-part progress of one lesson for the learner who asks. */
export class LessonPartsProgressType {
    /** The lesson. */
    @Field(() => String)
    lessonId!: string

    /** The four parts in the order of the page tabs. */
    @Field(() => [LessonPartProgressType])
    parts!: ReadonlyArray<LessonPartProgressType>

    /** The part "Học tiếp" opens, or null when every part is done or the lesson ships none. */
    @Field(() => String, { nullable: true })
    inProgressPart!: string | null

    /** The opener before and after. */
    @Field(() => LessonPartsOpenerType)
    opener!: LessonPartsOpenerType

    /** "Đã chứng minh" of the lesson from CI evidence; false until lessons have such evidence. */
    @Field(() => Boolean)
    proved!: boolean

    /** True when the learner asked for a scenario hint: the lesson reads "có hỗ trợ". */
    @Field(() => Boolean)
    usedHint!: boolean
}
