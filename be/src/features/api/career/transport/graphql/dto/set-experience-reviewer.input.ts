import { Field, InputType, Int } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsUUID, Max, Min, MaxLength } from "class-validator"
import { EXPERIENCE_PARTS, type ExperiencePart } from "@modules/domain/career"

@InputType()
/** An appointment, a new scope or the end of one, by the teacher. */
export class SetExperienceReviewerInput {
    /** The reviewer's provider subject. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    reviewerId!: string

    /** The parts the reviewer may sign. */
    @Field(() => [String])
    @IsArray()
    @ArrayMaxSize(10)
    @IsIn(EXPERIENCE_PARTS, { each: true })
    parts!: Array<ExperiencePart>

    /** The most open items at once; the default when left out. */
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(500)
    capacity: number | null = null

    /** The learners the reviewer must not review. */
    @Field(() => [String], { defaultValue: [] })
    @IsArray()
    @ArrayMaxSize(200)
    @IsUUID("all", { each: true })
    conflicts: Array<string> = []

    /** True ends the appointment. */
    @Field(() => Boolean, { defaultValue: false })
    @IsBoolean()
    end: boolean = false
}
