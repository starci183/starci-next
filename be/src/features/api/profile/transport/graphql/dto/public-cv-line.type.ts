import { Field, Int, ObjectType } from "@nestjs/graphql"

@ObjectType()
/** One kind of proof under a public CV line, with no reference to the run, the lesson or the person. */
export class PublicCvEvidenceType {
    /** How it was proved: ci-attested, cli-scenario, server-probe, proved-lesson or practice-accepted. */
    @Field(() => String)
    kind!: string

    /** How many problems were accepted when the proof is a count, else null. */
    @Field(() => Int, { nullable: true })
    count!: number | null
}

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

    /** The role the signer signed with, TEACHER or REVIEWER; a reviewer name is never public. */
    @Field(() => String)
    signerRole!: string

    /** What the line is about, as a short label in the asked locale. */
    @Field(() => String)
    subject!: string

    /** The kinds of proof under the line, without references. */
    @Field(() => [PublicCvEvidenceType])
    evidence!: Array<PublicCvEvidenceType>
}
