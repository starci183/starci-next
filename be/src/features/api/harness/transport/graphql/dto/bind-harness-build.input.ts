import { Field, InputType } from "@nestjs/graphql"
import { IsString, Matches, MaxLength } from "class-validator"

@InputType()
/** The build to bind and the GitHub repository whose attested CI proves it. */
export class BindHarnessBuildInput {
    /** The build id. */
    @Field(() => String)
    @IsString()
    @MaxLength(64)
    @Matches(/^[a-z0-9][a-z0-9-]{0,63}$/u)
    buildId!: string

    /** The GitHub repository, owner/name or a github.com address; whether it is one is checked by the harness capability. */
    @Field(() => String)
    @IsString()
    @MaxLength(200)
    repository!: string
}
