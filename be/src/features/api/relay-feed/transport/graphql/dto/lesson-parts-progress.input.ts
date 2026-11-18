import { Field, InputType } from "@nestjs/graphql"
import { ArrayMaxSize, IsArray, IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The lessons whose four-part progress is read. */
export class LessonPartsProgressInput {
    /** The lesson ids, lowercase slugs; 50 at most. */
    @Field(() => [String])
    @IsArray()
    @ArrayMaxSize(50)
    @IsString({ each: true })
    @MaxLength(100, { each: true })
    @Matches(/^[a-z0-9][a-z0-9-]*$/u, { each: true })
    lessonIds!: Array<string>
}
