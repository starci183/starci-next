import { Field, InputType } from "@nestjs/graphql"
import { Type } from "class-transformer"
import { ArrayMaxSize, IsArray, ValidateNested } from "class-validator"
import { GradeGuestOpenerInput } from "./grade-guest-opener.input"
import { MarkLessonSectionReadInput } from "./mark-lesson-section-read.input"

@InputType()
/** What a guest did on the device before signing in: the choices answered and the article sections read. */
export class ClaimGuestProgressInput {
    /** The choices answered, 60 at most; the server grades each again. */
    @Field(() => [GradeGuestOpenerInput])
    @IsArray()
    @ArrayMaxSize(60)
    @ValidateNested({ each: true })
    @Type(() => GradeGuestOpenerInput)
    answers!: Array<GradeGuestOpenerInput>

    /** The sections read, 200 at most. */
    @Field(() => [MarkLessonSectionReadInput])
    @IsArray()
    @ArrayMaxSize(200)
    @ValidateNested({ each: true })
    @Type(() => MarkLessonSectionReadInput)
    sections!: Array<MarkLessonSectionReadInput>
}
