import type { ExperiencePart, Signer, SignerRole } from "./career.contracts"
import { CareerError, CareerErrorCode } from "./errors/career.error"

/**
 * The Keycloak realm roles of the review side (data.career.reviewer): TEACHER signs every part and appoints reviewers;
 * REVIEWER signs only the parts of an active appointment. A role in a client claim grants nothing: roles come only from the
 * verified session.
 */
export const CAREER_ROLES: Readonly<Record<"teacher" | "reviewer", SignerRole>> = {
    teacher: "TEACHER",
    reviewer: "REVIEWER",
}

/** An active appointment as the access checks read it. */
export interface ReviewerScope {
    /** The parts the reviewer may sign. */
    readonly parts: ReadonlyArray<ExperiencePart>
    /** The learners the reviewer must not review. */
    readonly conflicts: ReadonlyArray<string>
}

/** The item facts an access check reads. */
export interface ReviewTarget {
    /** The learner of the item. */
    readonly learnerId: string
    /** Its part. */
    readonly part: ExperiencePart
    /** Whether only the teacher may decide it. */
    readonly teacherOnly: boolean
}

/** The role a signer acts with: TEACHER first, then REVIEWER, or null for a learner. */
export const signerRoleOf = (signer: Signer): SignerRole | null => {
    if (signer.roles.includes(CAREER_ROLES.teacher)) return CAREER_ROLES.teacher
    return signer.roles.includes(CAREER_ROLES.reviewer) ? CAREER_ROLES.reviewer : null
}

/** The role of a signer, refusing CAREER_REVIEW_FORBIDDEN to a caller who holds neither. */
export const requireSignerRole = (signer: Signer): SignerRole => {
    const role = signerRoleOf(signer)
    if (role === null) throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
    return role
}

/** Refuses CAREER_REVIEW_FORBIDDEN to anyone but the teacher. */
export const requireTeacher = (signer: Signer): void => {
    if (signerRoleOf(signer) !== CAREER_ROLES.teacher) throw new CareerError({ code: CareerErrorCode.ReviewForbidden })
}

/**
 * Whether a signer may decide an item: never their own item; the teacher every other item; a reviewer only with an active
 * appointment whose parts cover the item, the learner outside its conflicts, and an item not held for the teacher.
 */
export const maySign = (
    signer: Signer,
    role: SignerRole,
    scope: ReviewerScope | null,
    target: ReviewTarget,
): boolean => {
    if (signer.subject === target.learnerId) return false
    if (role === CAREER_ROLES.teacher) return true
    if (scope === null || target.teacherOnly) return false
    return scope.parts.includes(target.part) && !scope.conflicts.includes(target.learnerId)
}
