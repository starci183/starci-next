import { Field, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** The item a signer opens. */
export class ReviewItemInput {
    /** The item. */
    @Field(() => String)
    @MaxLength(40)
    @IsUUID()
    itemId!: string
}
