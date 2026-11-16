import { Field, InputType } from "@nestjs/graphql"
import { IsString, IsUUID, Matches, MaxLength } from "class-validator"

@InputType()
/** The build to bind and the learner agent project whose CI proves it; whether the project is the learner own is checked by the project capability. */
export class BindHarnessBuildInput {
    /** The build id. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(/^[a-z0-9][a-z0-9-]{0,63}$/u)
    buildId!: string

    /** The project id. */
    @Field(() => String)
    @IsUUID()
    projectId!: string
}
