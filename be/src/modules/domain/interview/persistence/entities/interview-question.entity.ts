import { Column, Entity, PrimaryColumn } from "typeorm"
import type { InterviewerMaterial, Localized, QuestionGrading, QuestionPrompt } from "../../interview.contracts"

@Entity("interview_questions")
/** One question of a bank version: the public prompts, the interviewer's material and the server-only grading data. */
export class InterviewQuestionEntity {
    /** The bank id. */
    @PrimaryColumn({ name: "bank_id", type: "text" })
    bankId!: string

    /** The bank version. */
    @PrimaryColumn({ name: "bank_version", type: "text" })
    bankVersion!: string

    /** The question id: `<bankId>/<n>`. */
    @PrimaryColumn({ name: "question_id", type: "text" })
    questionId!: string

    /** The position in the bank. */
    @Column({ name: "sort_index", type: "integer" })
    sortIndex!: number

    /** Whether the teacher marked the question Premium. */
    @Column({ name: "is_premium", type: "boolean" })
    isPremium!: boolean

    /** `technical` or `behavioral`. */
    @Column({ name: "family", type: "varchar", length: 16 })
    family!: string

    /** `junior`, `middle` or `senior`. */
    @Column({ name: "tier", type: "varchar", length: 8 })
    tier!: string

    /** The kind. */
    @Column({ name: "kind", type: "varchar", length: 32 })
    kind!: string

    /** The topic tags. */
    @Column({ name: "tags", type: "text", array: true })
    tags!: Array<string>

    /** The competency of a behavioural question. */
    @Column({ name: "competency", type: "text", nullable: true })
    competency!: string | null

    /** The leadership tier of a senior behavioural question. */
    @Column({ name: "leadership_tier", type: "text", nullable: true })
    leadershipTier!: string | null

    /** The public prompts by code language, then locale. */
    @Column({ name: "bodies", type: "jsonb" })
    bodies!: Record<string, Localized<QuestionPrompt>>

    /** The follow-ups and hints per locale. */
    @Column({ name: "interviewer", type: "jsonb" })
    interviewer!: Localized<InterviewerMaterial>

    /** The grading data; it never leaves the server before grading. */
    @Column({ name: "grading", type: "jsonb" })
    grading!: QuestionGrading
}
