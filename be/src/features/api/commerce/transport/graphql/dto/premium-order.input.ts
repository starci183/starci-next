import { Field, ID, InputType } from "@nestjs/graphql"
import { IsUUID, MaxLength } from "class-validator"

@InputType()
/** The premiumOrder arguments: the id of the order. */
export class PremiumOrderInput {
    /** The order the learner started. */
    @Field(() => ID)
    @IsUUID()
    @MaxLength(36)
    orderId!: string
}
