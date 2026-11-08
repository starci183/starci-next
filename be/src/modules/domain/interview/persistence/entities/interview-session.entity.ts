import { Column, Entity, PrimaryColumn } from "typeorm"
import type { GradedBy, Scorecard, SessionQuestion } from "../../interview.contracts"

@Entity("interview_sessions")
/** One interview of a learner: its setup, the questions drawn at the start, where it stands and its scorecard once graded. */
export class InterviewSessionEntity {
    /** The session id. */
    @PrimaryColumn({ name: "session_id", type: "uuid" })
    sessionId!: string

    /** The learner. */
    @Column({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The idempotency key of the start. */
    @Column({ name: "client_request_id", type: "text" })
    clientRequestId!: string

    /** The outcome track. */
    @Column({ name: "track", type: "text" })
    track!: string

    /** The tier. */
    @Column({ name: "tier", type: "varchar", length: 8 })
    tier!: string

    /** The locale of the prompts and the feedback. */
    @Column({ name: "locale", type: "varchar", length: 8 })
    locale!: string

    /** The code language asked, or null. */
    @Column({ name: "language", type: "text", nullable: true })
    language!: string | null

    /** How many questions. */
    @Column({ name: "length", type: "integer" })
    length!: number

    /** `free` or `premium`. */
    @Column({ name: "access", type: "varchar", length: 8 })
    access!: string

    /** `YYYY-MM` in Asia/Ho_Chi_Minh when the session is free. */
    @Column({ name: "free_month", type: "varchar", length: 7, nullable: true })
    freeMonth!: string | null

    /** The questions drawn at the start, fixed for the session. */
    @Column({ name: "questions", type: "jsonb" })
    questions!: Array<SessionQuestion>

    /** The position of the open question. */
    @Column({ name: "current_position", type: "integer" })
    currentPosition!: number

    /** Where the session stands. */
    @Column({ name: "status", type: "varchar", length: 16 })
    status!: string

    /** The scorecard once graded. */
    @Column({ name: "scorecard", type: "jsonb", nullable: true })
    scorecard!: Scorecard | null

    /** The stable code of a failed grading. */
    @Column({ name: "failure_code", type: "varchar", length: 64, nullable: true })
    failureCode!: string | null

    /** The model that graded the session. */
    @Column({ name: "graded_by", type: "jsonb", nullable: true })
    gradedBy!: GradedBy | null

    /** The overall score, copied from the scorecard for history and evidence. */
    @Column({ name: "overall_score", type: "integer", nullable: true })
    overallScore!: number | null

    /** The verdict, copied from the scorecard. */
    @Column({ name: "verdict", type: "varchar", length: 12, nullable: true })
    verdict!: string | null

    /** The technical pillar score. */
    @Column({ name: "technical_score", type: "integer", nullable: true })
    technicalScore!: number | null

    /** The technical pillar verdict. */
    @Column({ name: "technical_verdict", type: "varchar", length: 12, nullable: true })
    technicalVerdict!: string | null

    /** The behavioural pillar score. */
    @Column({ name: "behavioral_score", type: "integer", nullable: true })
    behavioralScore!: number | null

    /** The behavioural pillar verdict. */
    @Column({ name: "behavioral_verdict", type: "varchar", length: 12, nullable: true })
    behavioralVerdict!: string | null

    /** When the session started. */
    @Column({ name: "started_at", type: "timestamptz" })
    startedAt!: Date

    /** When the session was submitted. */
    @Column({ name: "submitted_at", type: "timestamptz", nullable: true })
    submittedAt!: Date | null

    /** When the session was graded. */
    @Column({ name: "graded_at", type: "timestamptz", nullable: true })
    gradedAt!: Date | null

    /** When the learner last acted; a session idle for an hour is abandoned. */
    @Column({ name: "last_activity_at", type: "timestamptz" })
    lastActivityAt!: Date

    /** When the row last changed. */
    @Column({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date
}
