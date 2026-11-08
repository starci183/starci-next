import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** The signature of a verified item: the signer's role and date, never a name. */
export class ExperienceSignatureType {
    /** TEACHER or REVIEWER. */
    @Field(() => String)
    role!: string

    /** When it was signed. */
    @Field(() => String)
    signedAt!: string
}
