import { Field, ObjectType } from "@nestjs/graphql"
import { PublicCvLineType } from "./public-cv-line.type"

@ObjectType()
/** The public CV of a learner: who they are and the verified lines they show; no score, reviewer or e-mail. */
export class PublicCvType {
    /** The display name, else the name of the account. */
    @Field(() => String)
    displayName!: string

    /** A short-lived address of the avatar, or null. */
    @Field(() => String, { nullable: true })
    avatarUrl!: string | null

    /** The verified lines the learner shows, newest signature first. */
    @Field(() => [PublicCvLineType])
    lines!: Array<PublicCvLineType>
}
