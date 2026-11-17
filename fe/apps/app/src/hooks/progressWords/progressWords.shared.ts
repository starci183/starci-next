import type { useFormatter, useTranslations } from "next-intl"

/** The translator of the `app.progress` catalog. */
export type ProgressTranslate = ReturnType<typeof useTranslations>

/** The formatter of the reader's locale. */
export type ProgressFormatter = ReturnType<typeof useFormatter>

/** The Harness area is a standalone area of the app with no entry in the shared route table yet. */
export const HARNESS_ROUTE = "/harness"

/** The tones the progress badges take. */
export type ProgressTone = "success" | "accent" | "muted" | "danger" | "warning"

/** A status chip with its leading dot. */
export type ProgressBadge = { readonly label: string; readonly tone: ProgressTone; readonly isDot: true }

/** The chip of a proof state: proved green, practising accent, nothing yet muted. */
export const proofBadgeOf = (t: ProgressTranslate, state: string): ProgressBadge => {
    if (state === "proved") return { label: t("harness.proved"), tone: "success", isDot: true }
    if (state === "practising") return { label: t("harness.practising"), tone: "accent", isDot: true }
    return { label: t("harness.none"), tone: "muted", isDot: true }
}
