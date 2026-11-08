import { Field, InputType } from "@nestjs/graphql"
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator"

@InputType()
/** A project and the GitHub repository it is bound to. */
export class SetProjectRepositoryInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string

    /** `owner/name`, or a github.com address. */
    @Field(() => String)
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    repository!: string
}
