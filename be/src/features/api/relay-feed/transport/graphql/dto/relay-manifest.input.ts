import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The relayManifest arguments: the task the device asks the checks of. */
export class RelayManifestInput {
    /** The task (a project id). */
    @Field(() => String)
    @IsString()
    @MaxLength(100)
    @Matches(/^[A-Za-z0-9._:/-]+$/u)
    taskId!: string
}
