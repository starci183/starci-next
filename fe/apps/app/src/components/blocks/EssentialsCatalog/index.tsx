"use client"

import { useLocale, useTranslations } from "next-intl"
import { catalogViewOf, useCatalogFilters, useCatalogLabels, useCatalogWords } from "@/hooks/catalog"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useGetEssentialsSwr, useGetLessonProgressSwr, useGetLessonTopicsSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { CATALOG_PLACEHOLDER } from "@/modules/types"
import { EssentialsCatalogBase } from "./component"

/** The connected Essentials catalog: reads the published lessons in the page's language, filters them on the client and words every card. */
export const EssentialsCatalog = () => {
    const t = useTranslations("app.essentials.catalog")
    const locale = useLocale()
    const read = useGetEssentialsSwr(locale)
    const { filters, choose, clear } = useCatalogFilters()
    const words = useCatalogWords()
    const progress = useGetLessonProgressSwr((read.data ?? []).map((lesson) => lesson.id)).data ?? {}
    const topics =
        useGetLessonTopicsSwr([...new Set((read.data ?? []).map((lesson) => lesson.topic.id))], locale).data ?? {}
    return (
        <EssentialsCatalogBase
            props={{
                slot: mapSlot(slotOfSwr(read), (lessons) => catalogViewOf(lessons, filters, progress, words, topics)),
                placeholder: CATALOG_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: useCatalogLabels(),
                filters,
                plansHref: APP_ROUTES.premium,
            }}
            on={{ retry: () => void read.mutate(), choose, clear }}
        />
    )
}
