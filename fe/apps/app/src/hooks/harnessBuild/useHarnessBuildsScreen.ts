"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useLocale, useTranslations } from "next-intl"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryHarnessBuildsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { harnessBuildPath } from "@/modules/routes"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { harnessHeaderOf, useHarnessCommonLabels } from "@/hooks/harness"

/** One build as the list of part 1 draws it. */
export type HarnessBuildItemView = {
    readonly id: string
    readonly title: string
    readonly summary: string
    readonly keys: string
    readonly practising: string
    readonly proved: string
    readonly isDone: boolean
    readonly href: string
}

/** The words of the list of builds. */
export type HarnessBuildsLabels = {
    readonly listTitle: string
    readonly empty: string
}

/** The list of builds of part 1. */
export type HarnessBuildsScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<ReadonlyArray<HarnessBuildItemView>>
        readonly placeholder: ReadonlyArray<HarnessBuildItemView>
        readonly slotLabels: SlotLabels
        readonly labels: HarnessBuildsLabels
    }
    readonly on: { readonly retry: () => void }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const HARNESS_BUILDS_PLACEHOLDER: ReadonlyArray<HarnessBuildItemView> = [1, 2, 3].map((n) => ({
    id: `placeholder-${n}`,
    title: "xxxxxxxxxxxxxxxx",
    summary: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    keys: "xxxxxx",
    practising: "x / x",
    proved: "xxxxxx",
    isDone: false,
    href: `/${n}`,
}))

/** The connected list of builds: reads the catalog and words each build with its e2e and stage counts. */
export const useHarnessBuildsScreen = (): HarnessBuildsScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.builds")
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessBuildsSwr(locale)
    useDocumentTitle(t("title"))
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "build",
                title: t("title"),
                description: t("description"),
                trail: [],
            }),
            slot: mapSlot(slotOfSwr(read), (builds) =>
                builds.map((build): HarnessBuildItemView => ({
                    id: build.id,
                    title: build.title,
                    summary: build.summary,
                    keys: build.keys.join(" · "),
                    practising: t("practising", { n: build.practisingStages, total: build.stageCount }),
                    proved: t("proved", { n: build.provedStages, total: build.stageCount }),
                    isDone: build.stageCount > 0 && build.provedStages === build.stageCount,
                    href: harnessBuildPath(build.id),
                })),
            ),
            placeholder: HARNESS_BUILDS_PLACEHOLDER,
            slotLabels: slotLabels(t("empty")),
            labels: { listTitle: t("listTitle"), empty: t("empty") },
        },
        on: { retry: () => void read.mutate() },
    }
}
