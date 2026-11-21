import type { BadgeTone } from "@starci/grammar/common"
import { ApiFailure } from "@/modules/failure"

/** The account roles of the review side (data.career.reviewer); a role in the browser only chooses what to draw. */
export const SIGNER_ROLES = { teacher: "TEACHER", reviewer: "REVIEWER" } as const

/** The states of an item, in the order the canvas tabs list them. */
export const EXPERIENCE_TABS = [
    "all",
    "verified",
    "pending-review",
    "ai-graded",
    "returned",
    "practising",
    "revoked",
] as const

/** The sources of an item, as the filter chips list them; the part of an item picks its source. */
export const EXPERIENCE_SOURCES = ["all", "essentials", "projects", "harness", "practice"] as const

/** One source chip of the learner's list. */
export type ExperienceSource = (typeof EXPERIENCE_SOURCES)[number]

/** The source an item belongs to; a part the list does not name (the retired incidents) reads as Essentials. */
export const sourceOfPart = (part: string): ExperienceSource =>
    part === "projects" || part === "harness" || part === "practice" ? part : "essentials"

/** One tab of the learner's list. */
export type ExperienceTab = (typeof EXPERIENCE_TABS)[number]

/** The tone of the state badge: verified green, pending amber, graded accent, returned and revoked danger, practising neutral. */
const STATE_TONES: Readonly<Record<string, BadgeTone>> = {
    verified: "success",
    "pending-review": "warning",
    "ai-graded": "accent",
    returned: "danger",
    revoked: "danger",
    practising: "neutral",
}

/** The badge tone of a state; an unknown state reads neutral. */
export const stateToneOf = (state: string): BadgeTone => STATE_TONES[state] ?? "neutral"

/** The tone of an SLA badge. */
const SLA_TONES: Readonly<Record<string, BadgeTone>> = {
    "on-time": "neutral",
    "due-soon": "warning",
    overdue: "danger",
}

/** The badge tone of where a pending item stands against its deadline. */
export const slaToneOf = (sla: string): BadgeTone => SLA_TONES[sla] ?? "neutral"

/** A template line as plain text: the bold markers of the catalog are dropped, the words kept. */
export const plainLineOf = (line: string): string => line.replaceAll("**", "")

/** The signer role the session asserts, or undefined for a learner. */
export const signerRoleOf = (roles: ReadonlyArray<string> | undefined): string | undefined => {
    if (roles?.includes(SIGNER_ROLES.teacher) === true) return SIGNER_ROLES.teacher
    return roles?.includes(SIGNER_ROLES.reviewer) === true ? SIGNER_ROLES.reviewer : undefined
}

/** The stable code of a refusal, or `other`; the screens branch on the code and never on the status. */
export const failureCodeOf = (error: unknown): string =>
    error instanceof ApiFailure && error.code !== undefined ? error.code : "other"

/** Whether the learner can send the item for review now. */
export const isSendable = (state: string): boolean => state === "ai-graded" || state === "returned"

/** The refusal codes the queue words; any other refusal reads as a failed save. */
export const REVIEW_REFUSALS: ReadonlySet<string> = new Set([
    "CAREER_REVIEW_NOTE_REQUIRED",
    "CAREER_REVIEW_FORBIDDEN",
    "CAREER_SELF_REVIEW",
    "CAREER_REVIEW_CONFLICT",
    "CAREER_NOT_VERIFIED",
])
