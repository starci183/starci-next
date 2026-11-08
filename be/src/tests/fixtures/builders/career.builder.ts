import { builder } from "@starci/jest-preset"
import {
    CAREER_MESSAGES,
    type ExperienceEvidence,
    type ExperienceGrade,
    type ExperiencePart,
    type ExperienceState,
    type LocalizedLine,
    type ProduceExperienceParams,
    type Signer,
    type SlotValues,
} from "@modules/domain/career"

/** The learner of the career specs. */
export const CAREER_LEARNER = "10000000-0000-4000-8000-0000000000c1"

/** Another learner. */
export const CAREER_OTHER_LEARNER = "10000000-0000-4000-8000-0000000000c2"

/** The teacher. */
export const CAREER_TEACHER = "10000000-0000-4000-8000-0000000000d1"

/** An appointed reviewer. */
export const CAREER_REVIEWER = "10000000-0000-4000-8000-0000000000d2"

/** An item id. */
export const CAREER_ITEM = "30000000-0000-4000-8000-0000000000c1"

/** The instant the specs run at: a Monday, 09:00 in Asia/Ho_Chi_Minh. */
export const CAREER_NOW = "2026-11-09T02:00:00.000Z"

/** The slot values of the essentials item. */
export const ESSENTIALS_SLOTS: SlotValues = {
    vi: { concept: "Request lifecycle VI", project: "Shop", language: "typescript", lesson: "request-lifecycle" },
    en: { concept: "Request lifecycle", project: "Shop", language: "typescript", lesson: "request-lifecycle" },
}

/** Fills a template of the career bundle with slot values, the way the catalog draws a line. */
const filled = (template: string | undefined, values: Readonly<Record<string, string>>): string =>
    Object.entries(values).reduce((line, [slot, value]) => line.replaceAll(`<${slot}>`, value), template ?? "")

/** The line the essentials template draws from those values. */
export const ESSENTIALS_DRAFT: LocalizedLine = {
    vi: filled(CAREER_MESSAGES.vi["lines.essentials.concept-proved"], ESSENTIALS_SLOTS.vi),
    en: filled(CAREER_MESSAGES.en["lines.essentials.concept-proved"], ESSENTIALS_SLOTS.en),
}

/** The proved-lesson evidence of the Essentials item. */
export const ESSENTIALS_EVIDENCE: ReadonlyArray<ExperienceEvidence> = [
    { kind: "lesson-proved", ref: "request-lifecycle", proofForm: "proved-lesson", at: CAREER_NOW },
]

/** A passing grade. */
export const PASSING_GRADE: ExperienceGrade = {
    result: "pass",
    criteria: [{ criterion: "Guards run before pipes", level: 2, evidenceQuote: "proved level 2/2" }],
}

/** A stored item as the capability reads it from its table. */
export interface StoredItemShape {
    item_id: string
    verification_code: string
    learner_id: string
    item_type: string
    part: ExperiencePart
    subject: string
    project_id: string | null
    evidence: ReadonlyArray<ExperienceEvidence>
    evidence_revision: number
    slot_values: SlotValues
    grade: ExperienceGrade | null
    draft_line: LocalizedLine | null
    line: LocalizedLine | null
    state: ExperienceState
    assignee_id: string | null
    teacher_only: boolean
    submitted_at: Date | null
    due_at: Date | null
    signer_role: "TEACHER" | "REVIEWER" | null
    signed_at: Date | null
    revoked_at: Date | null
    return_note: string | null
    return_count: number
    returned_line: LocalizedLine | null
    returned_evidence_revision: number | null
    shown_publicly: boolean
    revision: number
    updated_at: Date
}

/** A Essentials item in ai-graded with its default fields; a spec changes only the fields it varies. */
export const itemRowOf: (overrides?: Partial<StoredItemShape>) => StoredItemShape = builder<StoredItemShape>({
    item_id: CAREER_ITEM,
    verification_code: "K7Q2-9DLA-41TR",
    learner_id: CAREER_LEARNER,
    item_type: "essentials.concept-proved",
    part: "essentials",
    subject: "request-lifecycle@p-1",
    project_id: "p-1",
    evidence: ESSENTIALS_EVIDENCE,
    evidence_revision: 1,
    slot_values: ESSENTIALS_SLOTS,
    grade: PASSING_GRADE,
    draft_line: ESSENTIALS_DRAFT,
    line: null,
    state: "ai-graded",
    assignee_id: null,
    teacher_only: false,
    submitted_at: null,
    due_at: null,
    signer_role: null,
    signed_at: null,
    revoked_at: null,
    return_note: null,
    return_count: 0,
    returned_line: null,
    returned_evidence_revision: null,
    shown_publicly: false,
    revision: 1,
    updated_at: new Date(CAREER_NOW),
})

/** A reviewer appointment as the reviewer statements answer it. */
export interface StoredReviewerShape {
    reviewer_id: string
    parts: ReadonlyArray<ExperiencePart>
    capacity: number
    conflicts: ReadonlyArray<string>
    appointed_at: Date
    ended_at: Date | null
    open_items: number
}

/** An active appointment of the reviewer over Essentials and Projects. */
export const reviewerRowOf: (overrides?: Partial<StoredReviewerShape>) => StoredReviewerShape =
    builder<StoredReviewerShape>({
        reviewer_id: CAREER_REVIEWER,
        parts: ["essentials", "projects"],
        capacity: 30,
        conflicts: [],
        appointed_at: new Date(CAREER_NOW),
        ended_at: null,
        open_items: 0,
    })

/** What a producer hands the engine for the Essentials item. */
export const produceParamsOf: (overrides?: Partial<ProduceExperienceParams>) => ProduceExperienceParams =
    builder<ProduceExperienceParams>({
        learnerId: CAREER_LEARNER,
        itemType: "essentials.concept-proved",
        subject: "request-lifecycle@p-1",
        projectId: "p-1",
        evidence: ESSENTIALS_EVIDENCE,
        slotValues: ESSENTIALS_SLOTS,
        grade: PASSING_GRADE,
    })

/** The teacher's session. */
export const teacherOf: (overrides?: Partial<Signer>) => Signer = builder<Signer>({
    subject: CAREER_TEACHER,
    roles: ["TEACHER"],
})

/** An appointed reviewer's session. */
export const reviewerOf: (overrides?: Partial<Signer>) => Signer = builder<Signer>({
    subject: CAREER_REVIEWER,
    roles: ["REVIEWER"],
})
