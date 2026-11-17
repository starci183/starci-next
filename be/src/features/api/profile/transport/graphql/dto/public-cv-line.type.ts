import { Field, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One verified line of a public CV. */
export class PublicCvLineType {
    /** The signed line in the asked locale. */
    @Field(() => String)
    line!: string

    /** The part that granted it: essentials, projects, incidents, practice or harness. */
    @Field(() => String)
    source!: string

    /** The public verification code of /verify/{code}. */
    @Field(() => String)
    verificationCode!: string

    /** When it was signed, ISO 8601. */
    @Field(() => String)
    signedAt!: string
}
