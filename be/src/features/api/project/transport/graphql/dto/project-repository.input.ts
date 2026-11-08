import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** The project whose GitHub binding is read. */
export class ProjectRepositoryInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string
}
