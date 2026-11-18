import type {
    ExperienceEvidence,
    ExperienceLocale,
    ProofForm,
    PublicEvidenceKind,
    PublicEvidenceView,
    SlotValues,
} from "./career.contracts"
import { EXPERIENCE_CATALOG } from "./experience-catalog.policy"

/** The public kind of each proof form: how the evidence was proved, and nothing of the run, the lesson or the person. */
const KIND_OF_FORM: Readonly<Record<ProofForm, PublicEvidenceKind>> = {
    "signed-ci": "ci-attested",
    "graded-session": "cli-scenario",
    "server-probe": "server-probe",
    "proved-lesson": "proved-lesson",
    judge: "practice-accepted",
}

/** The slot that carries the number of accepted problems of a practice proof. */
const COUNT_SLOT = "count"

/** Whether the item type is a CV line; a readiness signal never reaches a public CV (verified-experience rule 10). */
export const isCvLineType = (itemType: string): boolean =>
    EXPERIENCE_CATALOG.some((item) => item.itemType === itemType && item.output === "cv-line")

/** A whole positive number read from a slot value, or null. */
const countOf = (value: string | undefined): number | null => {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * The kinds of proof under a line, each once and in the order of the evidence, with no reference: a practice proof carries the
 * number of problems the pattern holds, taken from the slot values and never from the learner.
 */
export const publicEvidenceOf = (
    evidence: ReadonlyArray<ExperienceEvidence>,
    values: SlotValues,
    locale: ExperienceLocale,
): ReadonlyArray<PublicEvidenceView> => {
    const kinds = evidence.map((entry) => KIND_OF_FORM[entry.proofForm])
    return [...new Set(kinds)].map((kind) => ({
        kind,
        count: kind === "practice-accepted" ? countOf(values[locale][COUNT_SLOT]) : null,
    }))
}

/** The short label of what an item is about, from the slot its catalog entry names, in one locale; empty when the slot is empty. */
export const publicSubjectOf = (itemType: string, values: SlotValues, locale: ExperienceLocale): string => {
    const slot = EXPERIENCE_CATALOG.find((item) => item.itemType === itemType)?.subjectSlot
    return slot === undefined ? "" : (values[locale][slot] ?? "").trim()
}
