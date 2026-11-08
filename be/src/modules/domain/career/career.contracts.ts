/** The learning shards that grant experience items (decision.program.structure); layers grant none. */
export type ExperiencePart = "essentials" | "projects" | "incidents" | "practice" | "interview"

/** What a verified item feeds: a CV line, or a hiring-readiness signal that never becomes a CV line. */
export type ExperienceOutput = "cv-line" | "readiness"

/** Where an item stands: practising, ai-graded, pending review, verified, returned, revoked. */
export type ExperienceState = "practising" | "ai-graded" | "pending-review" | "verified" | "returned" | "revoked"

/** The role a signer signs with, asserted by Keycloak. */
export type SignerRole = "TEACHER" | "REVIEWER"

/** Who made a decision of the audit trail. */
export type ActorRole = "learner" | SignerRole | "system"

/** The actions the audit trail records. */
export type ReviewAction = "grade" | "submit" | "resubmit" | "assign" | "approve" | "return" | "escalate" | "revoke"

/** The decisions a signer makes on a pending item. */
export type ReviewVerdict = "approve" | "return"

/** The locales of an item line. */
export type ExperienceLocale = "vi" | "en"

/** How evidence was proved; relay-only evidence never reaches an item. */
export type ProofForm = "signed-ci" | "server-probe" | "graded-session" | "proved-lesson" | "judge"

/** Where a pending item stands against its review deadline. */
export type ReviewSla = "on-time" | "due-soon" | "overdue"

/** The tabs of the review queue: Waiting, Overdue, Unassigned. */
export type ReviewQueueTab = "pending" | "overdue" | "unassigned"

/** A line in both locales. */
export interface LocalizedLine {
    /** The Vietnamese line. */
    readonly vi: string
    /** The English line. */
    readonly en: string
}

/** One piece of StarCi evidence an item rests on. */
export interface ExperienceEvidence {
    /** What it is: a lesson result, a CI run, a probe run, a transcript. */
    readonly kind: string
    /** The StarCi reference of the evidence (a lesson id, a run id). */
    readonly ref: string
    /** How it was proved. */
    readonly proofForm: ProofForm
    /** When it was produced, as an ISO 8601 instant. */
    readonly at: string
}

/** The grade of one criterion. */
export interface CriterionGrade {
    /** The criterion. */
    readonly criterion: string
    /** The level reached, 0 to 2. */
    readonly level: number
    /** What in the evidence shows it. */
    readonly evidenceQuote: string
}

/** The grade the grader gave the evidence of an item. */
export interface ExperienceGrade {
    /** Whether the evidence passes the item's criteria. */
    readonly result: "pass" | "fail"
    /** The grade of each criterion. */
    readonly criteria: ReadonlyArray<CriterionGrade>
}

/** The values of the slots of an item's template, per locale; every value comes from StarCi evidence. */
export type SlotValues = Readonly<Record<ExperienceLocale, Readonly<Record<string, string>>>>

/** What a producer (Essentials, projects, incidents) hands the experience engine for one item. */
export interface ProduceExperienceParams {
    /** The learner. */
    readonly learnerId: string
    /** The catalog item type. */
    readonly itemType: string
    /** What the item is about (a lesson id, a project milestone), unique per learner and item type. */
    readonly subject: string
    /** The project the evidence belongs to, or null. */
    readonly projectId: string | null
    /** The evidence, already proved. */
    readonly evidence: ReadonlyArray<ExperienceEvidence>
    /** The slot values, taken from the evidence only. */
    readonly slotValues: SlotValues
    /** The grade of the evidence. */
    readonly grade: ExperienceGrade
}

/** The signature of a verified item. */
export interface ExperienceSignatureView {
    /** The role the signer signed with. */
    readonly role: SignerRole
    /** When it was signed. */
    readonly signedAt: string
}

/** One experience item as its learner reads it. */
export interface ExperienceItemView {
    /** The item id. */
    readonly itemId: string
    /** The public code of /verify/{code}; meaningful once verified. */
    readonly verificationCode: string
    /** The catalog item type. */
    readonly itemType: string
    /** The part that grants it. */
    readonly part: ExperiencePart
    /** What a verified item feeds. */
    readonly output: ExperienceOutput
    /** What it is about. */
    readonly subject: string
    /** The project the evidence belongs to, or null. */
    readonly projectId: string | null
    /** Where it stands. */
    readonly state: ExperienceState
    /** The line submitted for review, or null before a submit. */
    readonly line: LocalizedLine | null
    /** The line the grader drafted from the template, or null while practising. */
    readonly draftLine: LocalizedLine | null
    /** The evidence. */
    readonly evidence: ReadonlyArray<ExperienceEvidence>
    /** The grade, or null before grading. */
    readonly grade: ExperienceGrade | null
    /** The note of the last return, or null. */
    readonly returnNote: string | null
    /** How many times it was returned. */
    readonly returnCount: number
    /** The review deadline while pending, or null. */
    readonly dueAt: string | null
    /** The signature once verified, or null. */
    readonly signature: ExperienceSignatureView | null
    /** When it was revoked, or null. */
    readonly revokedAt: string | null
    /** Whether the learner shows it on the public profile. */
    readonly shownPublicly: boolean
    /** The interview questions the line must survive. */
    readonly defenseQuestions: ReadonlyArray<string>
    /** When it last changed. */
    readonly updatedAt: string
}

/** One item of the review queue. */
export interface ReviewQueueItemView extends ExperienceItemView {
    /** A short handle of the learner; never a name or an email. */
    readonly learnerHandle: string
    /** The reviewer it is assigned to, or null for the teacher's queue. */
    readonly assigneeId: string | null
    /** Whether only the teacher may decide it. */
    readonly teacherOnly: boolean
    /** Where it stands against its deadline. */
    readonly sla: ReviewSla
}

/** One row of an item's audit trail. */
export interface ReviewDecisionView {
    /** What was done. */
    readonly action: ReviewAction
    /** Who did it. */
    readonly actorRole: ActorRole
    /** The state before, or null for the first row. */
    readonly fromState: ExperienceState | null
    /** The state after. */
    readonly toState: ExperienceState
    /** The note of a return or revoke, or null. */
    readonly note: string | null
    /** When. */
    readonly at: string
}

/** One item as a signer reviews it, with its history. */
export interface ExperienceReviewItemView {
    /** The item. */
    readonly item: ReviewQueueItemView
    /** The audit trail, oldest first. */
    readonly history: ReadonlyArray<ReviewDecisionView>
}

/** Which items a learner lists. */
export interface MyExperienceParams {
    /** The learner. */
    readonly learnerId: string
    /** The state to list, or null for every item. */
    readonly state: ExperienceState | null
}

/** The item a producer created or regraded, or null when the evidence grants none. */
export type RecordedExperience = ExperienceItemView | null

/** The experience list of a learner. */
export interface MyExperienceView {
    /** The items, newest change first. */
    readonly items: ReadonlyArray<ExperienceItemView>
    /** Verified items that open the hiring bridge (Q-CA-8). */
    readonly hiringMinVerified: number
}

/** The review queue of a signer. */
export interface ReviewQueueView {
    /** The role the signer reads it with. */
    readonly role: SignerRole
    /** The items of the tab, oldest due first. */
    readonly items: ReadonlyArray<ReviewQueueItemView>
    /** How many items each tab holds. */
    readonly counts: Readonly<Record<ReviewQueueTab, number>>
}

/** What a recruiter sees of one item on /verify/{code}: no score, no code, no reviewer name. */
export interface VerificationView {
    /** The code. */
    readonly code: string
    /** The catalog item type. */
    readonly itemType: string
    /** The part. */
    readonly part: ExperiencePart
    /** The line that was signed. */
    readonly line: LocalizedLine
    /** Verified, or revoked. */
    readonly state: "verified" | "revoked"
    /** The role the signer signed with. */
    readonly signerRole: SignerRole
    /** When it was signed. */
    readonly signedAt: string
    /** When it was revoked, or null. */
    readonly revokedAt: string | null
    /** The kinds of evidence, without their references. */
    readonly evidenceKinds: ReadonlyArray<string>
}

/** A verified item as the path engine reads it: only verified items meet a done check. */
export interface VerifiedExperienceView {
    /** The item id. */
    readonly itemId: string
    /** The catalog item type. */
    readonly itemType: string
    /** The part. */
    readonly part: ExperiencePart
    /** What it is about. */
    readonly subject: string
    /** The project, or null. */
    readonly projectId: string | null
    /** When it was signed. */
    readonly signedAt: string
}

/** The caller of a signer door: the verified session's subject and Keycloak roles. */
export interface Signer {
    /** The provider subject. */
    readonly subject: string
    /** The roles the verified token asserts. */
    readonly roles: ReadonlyArray<string>
}

/** What a learner submits for review. */
export interface SubmitExperienceParams {
    /** The learner. */
    readonly learnerId: string
    /** The item. */
    readonly itemId: string
    /** The line, the draft or a rewording that keeps every filled slot and number. */
    readonly line: LocalizedLine
}

/** What a learner sets on a verified item. */
export interface ShowExperienceParams {
    /** The learner. */
    readonly learnerId: string
    /** The item. */
    readonly itemId: string
    /** Whether it shows on the public profile. */
    readonly shownPublicly: boolean
}

/** One decision of a batch. */
export interface ReviewDecisionInput {
    /** The item. */
    readonly itemId: string
    /** Approve or return. */
    readonly verdict: ReviewVerdict
    /** The note; required for a return. */
    readonly note: string | null
}

/** A batch of decisions by one signer; each item is applied on its own. */
export interface DecideExperienceParams {
    /** The signer. */
    readonly signer: Signer
    /** The decisions. */
    readonly decisions: ReadonlyArray<ReviewDecisionInput>
}

/** What one decision of a batch did. */
export interface DecisionResultView {
    /** The item. */
    readonly itemId: string
    /** The new state, or null when refused. */
    readonly state: ExperienceState | null
    /** The stable code of the refusal, or null. */
    readonly refusal: string | null
}

/** A revoke by the teacher. */
export interface RevokeExperienceParams {
    /** The signer. */
    readonly signer: Signer
    /** The item. */
    readonly itemId: string
    /** The reason, required. */
    readonly reason: string
}

/** A reassignment by the teacher. */
export interface AssignExperienceParams {
    /** The signer. */
    readonly signer: Signer
    /** The item. */
    readonly itemId: string
    /** The reviewer, or null for the teacher's queue. */
    readonly reviewerId: string | null
}

/** An appointment, or its end, by the teacher. */
export interface SetReviewerParams {
    /** The teacher. */
    readonly signer: Signer
    /** The reviewer's provider subject. */
    readonly reviewerId: string
    /** The parts the reviewer may sign. */
    readonly parts: ReadonlyArray<ExperiencePart>
    /** The most open items at once, or null for the default. */
    readonly capacity: number | null
    /** The learners the reviewer must not review. */
    readonly conflicts: ReadonlyArray<string>
    /** True ends the appointment. */
    readonly end: boolean
}

/** One reviewer appointment. */
export interface ReviewerView {
    /** The reviewer's provider subject. */
    readonly reviewerId: string
    /** The parts the reviewer may sign. */
    readonly parts: ReadonlyArray<ExperiencePart>
    /** The most open items at once. */
    readonly capacity: number
    /** The learners the reviewer must not review. */
    readonly conflicts: ReadonlyArray<string>
    /** When appointed. */
    readonly appointedAt: string
    /** When ended, or null while active. */
    readonly endedAt: string | null
    /** How many pending items are assigned to the reviewer. */
    readonly openItems: number
}

/** The review settings: the proposed defaults of Q-CA-3..8, each configurable. */
export interface CareerSettings {
    /** Working days a signer has from pending review (Q-CA-4). */
    readonly reviewWorkingDays: number
    /** Working days after which the item is due soon and the assignee is reminded (Q-CA-4). */
    readonly reminderWorkingDays: number
    /** Returns after which the next resubmit goes to the teacher only (Q-CA-5). */
    readonly returnsBeforeTeacher: number
    /** Calendar days the teacher has for such a resubmit (Q-CA-5). */
    readonly teacherHoldDays: number
    /** Open items a reviewer holds at once by default (Q-CA-3). */
    readonly reviewerCapacity: number
    /** Verified items that open the hiring bridge (Q-CA-8). */
    readonly hiringMinVerified: number
}
