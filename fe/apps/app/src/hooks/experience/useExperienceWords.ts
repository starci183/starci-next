"use client"

import { useFormatter, useTranslations } from "next-intl"

/** The words every experience screen is drawn with. */
export interface ExperienceWords {
    /** The label of a state. */
    readonly state: (state: string) => string
    /** The label of a part. */
    readonly part: (part: string) => string
    /** The label of a signer role. */
    readonly role: (role: string) => string
    /** The label of an evidence kind. */
    readonly evidence: (kind: string) => string
    /** A date in the reader's locale. */
    readonly date: (iso: string) => string
}

/** The states the catalog words. */
const STATES: ReadonlySet<string> = new Set([
    "practising",
    "ai-graded",
    "pending-review",
    "verified",
    "returned",
    "revoked",
])

/** The parts the catalog words. */
const PARTS: ReadonlySet<string> = new Set(["essentials", "projects", "incidents", "practice", "interview"])

/** The evidence kinds the catalog words. */
const EVIDENCE: ReadonlySet<string> = new Set(["lesson-proved", "signed-ci", "server-probe", "graded-session", "judge"])

/** The signer roles the catalog words. */
const ROLES: ReadonlySet<string> = new Set(["TEACHER", "REVIEWER"])

/** The keys a translator knows; anything else falls back to `other`. */
const known = (keys: ReadonlySet<string>, key: string, fallback: string): string => (keys.has(key) ? key : fallback)

/** Resolves the state, part, role, evidence and date words of the experience screens. */
export const useExperienceWords = (): ExperienceWords => {
    const t = useTranslations("app.experience")
    const format = useFormatter()
    return {
        state: (state) => (STATES.has(state) ? t(`state.${state}`) : state),
        part: (part) => (PARTS.has(part) ? t(`part.${part}`) : part),
        role: (role) => t(`role.${known(ROLES, role, "REVIEWER")}`),
        evidence: (kind) => t(`evidence.${known(EVIDENCE, kind, "other")}`),
        date: (iso) => format.dateTime(new Date(iso), { dateStyle: "medium" }),
    }
}
