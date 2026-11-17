"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import type { OutlineEntry } from "@starci-next/ui"
import { useLocale, useTranslations } from "next-intl"
import { harnessHeaderOf, outlineOf, useHarnessCommonLabels, type HarnessCommonLabels } from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessDocSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { HARNESS_ROUTES } from "@/modules/routes"
import type { DataSlot, HarnessSectionView, SlotLabels } from "@/modules/types"

/** One article as drawn: its sections and its outline. */
export type HarnessDocPageView = {
    readonly title: string
    readonly summary: string
    readonly sections: ReadonlyArray<HarnessSectionView>
    readonly outline: ReadonlyArray<OutlineEntry>
}

/** The words of the article page. */
export type HarnessDocLabels = {
    readonly outlineTitle: string
    readonly outlineEmpty: string
}

/** The article page. */
export type HarnessDocScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<HarnessDocPageView>
        readonly placeholder: HarnessDocPageView
        readonly slotLabels: SlotLabels
        readonly labels: HarnessDocLabels
        readonly common: HarnessCommonLabels
    }
    readonly on: { readonly retry: () => void }
}

/** The same-shape article the skeleton draws while the first read runs. */
export const HARNESS_DOC_PLACEHOLDER: HarnessDocPageView = {
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxx",
    sections: [1, 2].map((n) => ({
        id: `s${n}`,
        title: "xxxxxxxxxxxxxxxx",
        markdown: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    })),
    outline: [1, 2, 3].map((n) => ({ id: `o${n}`, label: "xxxxxxxxxxxxxxxx", href: `#o${n}` })),
}

/** What the route hands the article page: the article in the address. */
type DocRoute = { readonly slug: string }

/** The connected article page: reads the article and cuts its markdown into anchored sections with an outline. */
export const useHarnessDocScreen = (route: DocRoute): HarnessDocScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.doc")
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessDocSwr(route.slug, locale)
    useDocumentTitle(read.data?.title)
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "docs",
                title: read.data?.title ?? t("title"),
                ...(read.data === undefined ? {} : { description: read.data.summary }),
                trail: [[common.tabs.docs, HARNESS_ROUTES.docs]],
            }),
            slot: mapSlot(slotOfSwr(read), (doc): HarnessDocPageView => ({
                title: doc?.title ?? "",
                summary: doc?.summary ?? "",
                sections: doc?.sections ?? [],
                outline: outlineOf(doc?.sections ?? []),
            })),
            placeholder: HARNESS_DOC_PLACEHOLDER,
            slotLabels: slotLabels(t("missing")),
            labels: { outlineTitle: t("outlineTitle"), outlineEmpty: t("outlineEmpty") },
            common,
        },
        on: { retry: () => void read.mutate() },
    }
}
