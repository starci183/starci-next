import { Field, InputType } from "@nestjs/graphql"
import { IsIn, IsUUID, MaxLength } from "class-validator"
import type { ProjectLocale } from "@modules/domain/project"

@InputType()
/** A project whose practice results are pulled from the learner machine. */
export class SyncProjectPracticeInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** The locale of the text; Vietnamese when left out. */
    @Field(() => String, { defaultValue: "vi" })
    @IsIn(["vi", "en"])
    locale: ProjectLocale = "vi"
}
