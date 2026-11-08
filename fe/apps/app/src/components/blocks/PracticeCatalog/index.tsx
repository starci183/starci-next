"use client"

import { useLocale, useTranslations } from "next-intl"
import { useViewerPremium } from "@/hooks/catalog"
import { patternRowsOf, usePracticeListWords } from "@/hooks/practice"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPracticePatternsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { PRACTICE_CATALOG_PLACEHOLDER, PracticeCatalogBase } from "./component"

/** The connected Practice code screen: reads the patterns with the learner's progress and words every row. */
export const PracticeCatalog = () => {
    const t = useTranslations("app.practice.catalog")
    const read = useQueryPracticePatternsSwr(useLocale())
    const words = usePracticeListWords()
    const isPremium = useViewerPremium()
    useDocumentTitle(t("pageTitle"))
    return (
        <PracticeCatalogBase
            props={{
                title: t("pageTitle"),
                browse: {
                    slot: mapSlot(slotOfSwr(read), (patterns) => ({
                        lines: [
                            t("facts", {
                                patterns: patterns.length,
                                problems: patterns.reduce((sum, pattern) => sum + pattern.problemCount, 0),
                                accepted: patterns.reduce((sum, pattern) => sum + pattern.acceptedCount, 0),
                            }),
                            t("hiring"),
                        ],
                        rows: patternRowsOf(patterns, words),
                    })),
                    placeholder: PRACTICE_CATALOG_PLACEHOLDER,
                    slotLabels: useSlotLabels()(t("empty")),
                    cardLabel: t("pageTitle"),
                    intro: t("intro"),
                    upsell: isPremium
                        ? undefined
                        : { label: t("upsell"), note: t("upsellNote"), href: APP_ROUTES.premium },
                    listLabel: t("list"),
                    emptyLabel: t("empty"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
