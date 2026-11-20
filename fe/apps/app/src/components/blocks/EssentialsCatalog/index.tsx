"use client"

import { useLocale, useTranslations } from "next-intl"
import { catalogViewOf, useCatalogFilters, useCatalogLabels, useCatalogWords } from "@/hooks/catalog"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useGetEssentialsSwr, useGetLessonTopicsSwr, useQueryLessonPartsProgressSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { CATALOG_PLACEHOLDER } from "@/modules/types"
import { EssentialsCatalogBase } from "./component"

/** The connected Essentials catalog: reads the published lessons in the page's language, the topics that order them and the learner's four-part progress, filters on the client and words every row. */
export const EssentialsCatalog = () => {
    const t = useTranslations("app.essentials.catalog")
    const locale = useLocale()
    const read = useGetEssentialsSwr(locale)
    const { filters, choose, clear } = useCatalogFilters()
    const words = useCatalogWords()
    const lessonIds = (read.data ?? []).map((lesson) => lesson.id)
    const parts = useQueryLessonPartsProgressSwr(lessonIds).data ?? {}
    const topics =
        useGetLessonTopicsSwr([...new Set((read.data ?? []).map((lesson) => lesson.topic.id))], locale).data ?? {}
    return (
        <EssentialsCatalogBase
            props={{
                slot: mapSlot(slotOfSwr(read), (lessons) =>
                    catalogViewOf({ lessons, topics, parts, filters, words, plansHref: APP_ROUTES.premium }),
                ),
                placeholder: CATALOG_PLACEHOLDER,
                slotLabels: { ...useSlotLabels()(t("empty")), error: t("errorTitle") },
                errorText: t("errorText"),
                labels: useCatalogLabels(),
                filters,
            }}
            on={{ retry: () => void read.mutate(), choose, clear }}
        />
    )
}
