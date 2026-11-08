import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** A project to delete. */
export class DeleteProjectInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string
}
