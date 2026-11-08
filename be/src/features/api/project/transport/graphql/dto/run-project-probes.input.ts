import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** A project to probe at its deployed address. */
export class RunProjectProbesInput {
    /** The project. */
    @Field(() => String)
    @IsUUID()
    @MaxLength(36)
    projectId!: string
}
