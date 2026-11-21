"use client"

import { useTranslations } from "next-intl"
import type { EssentialPart } from "@/modules/types"

/** The parts a plan can lock, in order: every part after the opener. */
export const LOCKABLE_PARTS = [
    "source",
    "scenarios",
    "apply",
    "pattern",
] as const satisfies ReadonlyArray<EssentialPart>

/** The words of the locked part: the premium line, the guest line and the short note of each locked part. */
export type LockLabels = {
    readonly premiumTitle: string
    readonly guestTitle: string
    readonly guestNote: string
    readonly signIn: string
    readonly notes: Readonly<Record<(typeof LOCKABLE_PARTS)[number], string>>
}

/** Resolves the words of the locked part. */
export const useLockLabels = (): LockLabels => {
    const t = useTranslations("app.essentials.essential.lock")
    return {
        premiumTitle: t("premiumTitle"),
        guestTitle: t("guestTitle"),
        guestNote: t("guestNote"),
        signIn: t("signIn"),
        notes: {
            source: t("notes.source"),
            scenarios: t("notes.scenarios"),
            apply: t("notes.apply"),
            pattern: t("notes.pattern"),
        },
    }
}
