"use client"

import { useTranslations } from "next-intl"
import type { CatalogWords } from "@/modules/types"
import { useViewerPremium } from "./useViewerPremium"

/** Resolves the words the catalog and topic views are built with: the state of a lesson, the counts and the primary. */
export const useCatalogWords = (): CatalogWords => {
    const t = useTranslations("app.essentials.catalog")
    const isPremium = useViewerPremium()
    return {
        isPremium,
        minutes: (minutes) => t("minutes", { minutes }),
        partsLabel: (done) => t("partsLabel", { done }),
        facts: (topics, lessons, done) => t("facts", { topics, lessons, done }),
        factsFirst: (topics, lessons) => t("factsFirst", { topics, lessons }),
        groupProgress: (done, total) => t("groupProgress", { done, total }),
        viewAll: (count) => t("viewAll", { count }),
        state: {
            todo: t("state.todo"),
            done: t("state.done"),
            free: t("state.free"),
            partDone: (part) => t("state.partDone", { part }),
            doing: (part) => t("state.doing", { part }),
        },
        resume: (title, part) => t("resume", { title, part }),
        start: (title) => t("start", { title }),
        upgrade: t("upgrade"),
        opener: (right, total) => (right === undefined ? t("openerNone") : t("opener", { right, total })),
    }
}
