"use client"

import { useTranslations } from "next-intl"

/** The readable name of a learning path from its slug: the catalogue names the known ones, an unknown slug is spaced and capitalised (never shown raw). */
export const useTrackTitle = (): ((slug: string) => string) => {
    const t = useTranslations("app.review.trackNames")
    const known: Readonly<Record<string, () => string>> = {
        "backend-fullstack": () => t("backend-fullstack"),
        "ai-engineer": () => t("ai-engineer"),
        founder: () => t("founder"),
        "system-design-senior": () => t("system-design-senior"),
        "fullstack mastery": () => t("fullstack mastery"),
    }
    return (slug) => {
        const named = known[slug]
        if (named !== undefined) return named()
        const spaced = slug.replaceAll(/[-_]+/g, " ").trim()
        return spaced.charAt(0).toUpperCase() + spaced.slice(1)
    }
}
