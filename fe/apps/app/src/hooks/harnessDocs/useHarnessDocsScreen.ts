"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { harnessHeaderOf, useHarnessCommonLabels } from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessDocsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { harnessDocPath } from "@/modules/routes"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One article of part 3 as the list draws it. */
export type HarnessDocItemView = {
    readonly slug: string
    readonly title: string
    readonly summary: string
    readonly href: string
}

/** The words of the list of articles. */
export type HarnessDocsLabels = {
    readonly listTitle: string
    readonly empty: string
    readonly filterLabel: string
    readonly filterPlaceholder: string
    readonly clearLabel: string
}

/** The list of articles of part 3. */
export type HarnessDocsScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<ReadonlyArray<HarnessDocItemView>>
        readonly placeholder: ReadonlyArray<HarnessDocItemView>
        readonly slotLabels: SlotLabels
        readonly labels: HarnessDocsLabels
        readonly query: string
    }
    readonly on: { readonly retry: () => void; readonly search: (query: string) => void }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const HARNESS_DOCS_PLACEHOLDER: ReadonlyArray<HarnessDocItemView> = [1, 2].map((n) => ({
    slug: `d${n}`,
    title: "",
    summary: "",
    href: `/${n}`,
}))

/** The connected list of articles: reads the catalog and words each article with its reading time. */
export const useHarnessDocsScreen = (): HarnessDocsScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.docs")
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessDocsSwr(locale)
    const [query, setQuery] = useState("")
    const needle = query.trim().toLowerCase()
    useDocumentTitle(t("title"))
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "docs",
                title: t("title"),
                description: t("description"),
                trail: [],
            }),
            slot: mapSlot(slotOfSwr(read), (docs) =>
                docs
                    .filter((doc) => needle === "" || `${doc.title} ${doc.summary}`.toLowerCase().includes(needle))
                    .map((doc): HarnessDocItemView => ({
                        slug: doc.slug,
                        title: doc.title.replaceAll("`", ""),
                        summary: doc.summary.replaceAll("`", ""),
                        href: harnessDocPath(doc.slug),
                    })),
            ),
            placeholder: HARNESS_DOCS_PLACEHOLDER,
            slotLabels: slotLabels(t("empty"), { title: t("errorTitle"), text: t("errorText") }),
            labels: {
                listTitle: t("listTitle"),
                empty: needle === "" ? t("empty") : t("noMatch"),
                filterLabel: t("filterLabel"),
                filterPlaceholder: t("filterPlaceholder"),
                clearLabel: t("clearLabel"),
            },
            query,
        },
        on: { retry: () => void read.mutate(), search: setQuery },
    }
}
