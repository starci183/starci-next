"use client"

import { useTranslations } from "next-intl"
import type { CatalogWords } from "@/modules/types"
import { hoursText } from "./hoursText"
import { useViewerPremium } from "./useViewerPremium"

/** Resolves the words the catalog and topic views are built with: the state of a lesson, the counts and the primary. */
export const useCatalogWords = (): CatalogWords => {
    const t = useTranslations("app.essentials.catalog")
    const isPremium = useViewerPremium()
    return {
        isPremium,
        figure: { done: t("figureDone"), doing: t("figureDoing"), todo: t("figureTodo"), time: t("figureTime") },
        hours: (hours, minutes) => hoursText(t, hours, minutes),
        groupMeta: (lessons, minutes) =>
            t("groupMeta", {
                lessons,
                time: hoursText(t, Math.floor(minutes / 60), minutes % 60),
            }),
        groupState: { todo: t("groupTodo"), doing: t("groupDoing"), done: t("groupDone") },
        resumeKicker: (topic, position, total) => t("resumeKicker", { topic, position, total }),
        resumeProgress: (part, done) => t("resumeProgress", { part, done }),
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
        resume: () => t("resume"),
        start: () => t("start"),
        upgrade: t("upgrade"),
        opener: (right, total) => (right === undefined ? t("openerNone") : t("opener", { right, total })),
    }
}
