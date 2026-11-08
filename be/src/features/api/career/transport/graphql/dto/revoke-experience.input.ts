import { Field, InputType } from "@nestjs/graphql"
import { IsString, IsUUID, MaxLength } from "class-validator"

@InputType()
/** A revoke by the teacher. */
export class RevokeExperienceInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string

    /** Why it is revoked. */
    @Field(() => String)
    @IsString()
    @MaxLength(2000)
    reason!: string
}
