"use client"

import { useTranslations } from "next-intl"

/** The readable name of a learning path from its slug: the catalogue names it, an unknown slug is spaced and capitalised (never shown raw). */
export const useTrackTitle = (): ((slug: string) => string) => {
    const t = useTranslations("app.review.trackNames")
    return (slug) => {
        if (t.has(slug)) return t(slug)
        const spaced = slug.replaceAll(/[-_]+/g, " ").trim()
        return spaced.charAt(0).toUpperCase() + spaced.slice(1)
    }
}
