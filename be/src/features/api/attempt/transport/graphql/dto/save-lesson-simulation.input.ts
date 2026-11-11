import { Field, InputType } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsIn, IsString, Matches, MaxLength } from "class-validator"
import type { LessonLocale } from "@modules/domain/lesson"

@InputType()
/** Where the learner stands in a simulation: the state and the path of actions that led there. */
export class SaveLessonSimulationInput {
    /** The lesson id, a lowercase slug. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[a-z0-9][a-z0-9-]*$/u)
    lessonId!: string

    /** The version the learner plays, as the lesson query served it. */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    version!: string

    /** The simulation activity id. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    activityId!: string

    /** The locale of the lesson text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: LessonLocale = "vi"

    /** The state the learner is in now. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    currentStateId!: string

    /** The actions taken from the initial state to the current state; empty at the start or after stepping all the way back. */
    @Field(() => [String])
    @IsArray()
    @ArrayMaxSize(60)
    @IsString({ each: true })
    @MaxLength(200, { each: true })
    actionIds!: Array<string>
}
