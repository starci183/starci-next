"use client"

import { useTranslations } from "next-intl"
import type { CatalogLabels } from "@/modules/types"

/** Resolves the fixed words of the catalog: the tabs, the toolbar, the empty results. */
export const useCatalogLabels = (): CatalogLabels => {
    const t = useTranslations("app.essentials.catalog")
    return {
        title: t("title"),
        figuresLabel: t("figuresLabel"),
        resumeTitle: t("resumeTitle"),
        topicsTitle: t("topicsTitle"),
        topicRing: (done, total) => t("topicRing", { done, total }),
        fivePartsTitle: t("fivePartsTitle"),
        fiveParts: [1, 2, 3, 4, 5].map((n) => ({ id: String(n), title: t(`fivePart${n}`) })),
        breadcrumbs: t("breadcrumbs"),
        statusLabel: t("statusLabel"),
        statuses: [
            { id: "all", label: t("tabAll") },
            { id: "doing", label: t("tabDoing") },
            { id: "todo", label: t("tabTodo") },
            { id: "done", label: t("tabDone") },
        ],
        search: t("search"),
        searchPlaceholder: t("searchPlaceholder"),
        clearSearch: t("clearSearch"),
        topicSelect: t("topicSelect"),
        allTopics: t("allTopics"),
        planSelect: t("planSelect"),
        plans: [
            { id: "all", label: t("planAll") },
            { id: "free", label: t("planFree") },
            { id: "premium", label: t("planPremium") },
        ],
        viewTopic: t("viewTopic"),
        noResult: {
            title: (query) => t("noResultTitle", { query }),
            text: t("noResultText"),
            clear: t("clear"),
        },
        empty: t("empty"),
    }
}
