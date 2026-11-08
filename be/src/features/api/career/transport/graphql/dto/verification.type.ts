import { Field, ObjectType } from "@nestjs/graphql"
import { LocalizedLineType } from "./localized-line.type"

@ObjectType()
/** What a recruiter sees of one item: no score, no code, no reviewer name. */
export class VerificationType {
    /** The code. */
    @Field(() => String)
    code!: string

    /** The catalog item type. */
    @Field(() => String)
    itemType!: string

    /** The part. */
    @Field(() => String)
    part!: string

    /** The line that was signed. */
    @Field(() => LocalizedLineType)
    line!: LocalizedLineType

    /** verified or revoked. */
    @Field(() => String)
    state!: string

    /** The role the signer signed with. */
    @Field(() => String)
    signerRole!: string

    /** When it was signed. */
    @Field(() => String)
    signedAt!: string

    /** When it was revoked, or null. */
    @Field(() => String, { nullable: true })
    revokedAt!: string | null

    /** The kinds of evidence, without their references. */
    @Field(() => [String])
    evidenceKinds!: ReadonlyArray<string>
}
