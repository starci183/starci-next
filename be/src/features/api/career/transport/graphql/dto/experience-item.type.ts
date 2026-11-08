import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ExperienceEvidenceType } from "./experience-evidence.type"
import { ExperienceGradeType } from "./experience-grade.type"
import { ExperienceSignatureType } from "./experience-signature.type"
import { LocalizedLineType } from "./localized-line.type"

@ObjectType()
/** One experience item as its learner reads it. */
export class ExperienceItemType {
    /** The item id. */
    @Field(() => String)
    itemId!: string

    /** The public code of /verify/{code}; meaningful once verified. */
    @Field(() => String)
    verificationCode!: string

    /** The catalog item type. */
    @Field(() => String)
    itemType!: string

    /** The part that grants it. */
    @Field(() => String)
    part!: string

    /** cv-line, or readiness for an item that feeds the hiring bridge only. */
    @Field(() => String)
    output!: string

    /** What it is about. */
    @Field(() => String)
    subject!: string

    /** The project of the evidence, or null. */
    @Field(() => String, { nullable: true })
    projectId!: string | null

    /** practising, ai-graded, pending-review, verified, returned or revoked. */
    @Field(() => String)
    state!: string

    /** The submitted line, or null before a submit. */
    @Field(() => LocalizedLineType, { nullable: true })
    line!: LocalizedLineType | null

    /** The drafted line, or null while practising. */
    @Field(() => LocalizedLineType, { nullable: true })
    draftLine!: LocalizedLineType | null

    /** The evidence. */
    @Field(() => [ExperienceEvidenceType])
    evidence!: ReadonlyArray<ExperienceEvidenceType>

    /** The grade, or null before grading. */
    @Field(() => ExperienceGradeType, { nullable: true })
    grade!: ExperienceGradeType | null

    /** The note of the last return, or null. */
    @Field(() => String, { nullable: true })
    returnNote!: string | null

    /** How many times it was returned. */
    @Field(() => Int)
    returnCount!: number

    /** The review deadline while pending, or null. */
    @Field(() => String, { nullable: true })
    dueAt!: string | null

    /** The signature once verified, or null. */
    @Field(() => ExperienceSignatureType, { nullable: true })
    signature!: ExperienceSignatureType | null

    /** When it was revoked, or null. */
    @Field(() => String, { nullable: true })
    revokedAt!: string | null

    /** Whether it shows on the public profile. */
    @Field(() => Boolean)
    shownPublicly!: boolean

    /** The interview questions the line must survive. */
    @Field(() => [String])
    defenseQuestions!: ReadonlyArray<string>

    /** When it last changed. */
    @Field(() => String)
    updatedAt!: string
}
