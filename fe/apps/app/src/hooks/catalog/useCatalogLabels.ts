"use client"

import { useTranslations } from "next-intl"
import type { CatalogLabels } from "@/modules/types"
import { useViewerPremium } from "./useViewerPremium"

/** Resolves the fixed words of the catalog: the intro, the aside, the toolbar and the empty results. */
export const useCatalogLabels = (): CatalogLabels => {
    const t = useTranslations("app.essentials")
    const isPremium = useViewerPremium()
    return {
        eyebrow: t("catalog.eyebrow"),
        title: t("catalog.title"),
        all: t("catalog.all"),
        description: t("catalog.description"),
        asideLabel: t("catalog.asideLabel"),
        asideEmpty: t("catalog.asideEmpty"),
        open: t("catalog.open"),
        upsell: isPremium ? undefined : { label: t("catalog.upsell"), note: t("catalog.upsellNote") },
        toolbar: {
            search: t("catalog.search"),
            searchPlaceholder: t("catalog.searchPlaceholder"),
            clearSearch: t("catalog.clearSearch"),
            difficulty: t("catalog.difficulty"),
            language: t("catalog.language"),
            provider: t("catalog.provider"),
        },
        difficulties: [
            { id: "all", label: t("catalog.all") },
            { id: "foundation", label: t("difficulty.foundation") },
            { id: "intermediate", label: t("difficulty.intermediate") },
            { id: "advanced", label: t("difficulty.advanced") },
        ],
        resumeTitle: t("catalog.resumeTitle"),
        resumeAction: t("catalog.resumeAction"),
        noResult: { title: t("catalog.noResultTitle"), text: t("catalog.noResultText"), clear: t("catalog.clear") },
    }
}
