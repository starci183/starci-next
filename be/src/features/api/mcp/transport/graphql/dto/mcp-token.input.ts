import { Field, ID, InputType } from "@nestjs/graphql"
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator"

@InputType()
/** The createMcpToken arguments: the name the learner gives the token. */
export class CreateMcpTokenInput {
    /** The name, for example Claude. */
    @Field(() => String)
    @IsString()
    @MinLength(1)
    @MaxLength(60)
    name!: string
}

@InputType()
/** The revokeMcpToken arguments: the token id. */
export class RevokeMcpTokenInput {
    /** The token to revoke. */
    @Field(() => ID)
    @IsUUID()
    @MaxLength(36)
    id!: string
}
