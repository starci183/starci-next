"use client"

import type { PageHeaderContent } from "@starci/grammar/common"
import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { harnessHeaderOf, useHarnessCommonLabels, type HarnessCommonLabels } from "@/hooks/harness"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useMutateBindHarnessBuildSwr, useQueryHarnessBuildSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { HARNESS_ROUTES } from "@/modules/routes"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { buildViewOf, HARNESS_BUILD_PLACEHOLDER, type HarnessBuildScreenView } from "./harnessBuild.shared"

/** The words of the build page. */
export type HarnessBuildLabels = {
    readonly stagesTitle: string
    readonly pullLabel: string
    readonly pullDescription: string
    readonly casesTitle: string
    readonly caseColumn: string
    readonly outcomeColumn: string
    readonly detailColumn: string
    readonly onlyOpenLabel: string
    readonly onlyOpenDescription: string
    readonly casesEmpty: string
    readonly logTitle: string
    readonly stepsTitle: string
    readonly lockedTitle: string
    readonly lockedText: string
    readonly keysLabel: string
    readonly repoTitle: string
    readonly repoText: string
    readonly repoBound: string
    readonly repoUnbound: string
    readonly repoField: string
    readonly repoPlaceholder: string
    readonly repoBind: string
    readonly repoFailed: string
    readonly repoAudienceLabel: string
    readonly repoAudienceDescription: string
}

/** The build page: the stages with their e2e status, the stage on screen and its step guide. */
export type HarnessBuildScreen = {
    readonly props: {
        readonly header: PageHeaderContent
        readonly slot: DataSlot<HarnessBuildScreenView>
        readonly placeholder: HarnessBuildScreenView
        readonly slotLabels: SlotLabels
        readonly labels: HarnessBuildLabels
        readonly common: HarnessCommonLabels
        readonly isOnlyOpen: boolean
        readonly repository: string
        readonly isBinding: boolean
        readonly isBindFailed: boolean
    }
    readonly on: {
        readonly retry: () => void
        readonly setOnlyOpen: (isOnlyOpen: boolean) => void
        readonly changeRepository: (repository: string) => void
        readonly bind: () => void
    }
}

/** What the route hands the build page: the build in the address and the raw `stage` query. */
type BuildRoute = { readonly buildId: string; readonly stage: string | undefined }

/**
 * The connected build page: reads the build (again every two seconds while a stage is running, else every ten, so the e2e results
 * the learner's machine sends over the relay show up live), words the stages and the stage on screen, and holds the "only open
 * cases" switch.
 */
export const useHarnessBuildScreen = (route: BuildRoute): HarnessBuildScreen => {
    const locale = useLocale()
    const t = useTranslations("app.harness.build")
    const format = useFormatter()
    const common = useHarnessCommonLabels()
    const slotLabels = useSlotLabels()
    const read = useQueryHarnessBuildSwr(route.buildId, locale)
    const [isOnlyOpen, setOnlyOpen] = useState(false)
    const [repository, setRepository] = useState("")
    const [isBindFailed, setBindFailed] = useState(false)
    const binder = useMutateBindHarnessBuildSwr()
    useDocumentTitle(read.data?.title)
    const words = {
        common,
        count: (passed: number, total: number): string => t("count", { passed, total }),
        position: (n: number, total: number): string => t("position", { n, total }),
        when: (iso: string): string => format.dateTime(new Date(iso), { dateStyle: "medium", timeStyle: "short" }),
    }
    const stages = read.data?.stages ?? []
    const passed = stages.reduce((sum, stage) => sum + stage.passed, 0)
    const total = stages.reduce((sum, stage) => sum + stage.total, 0)
    return {
        props: {
            header: harnessHeaderOf(common, {
                active: "build",
                title: read.data?.title ?? t("title"),
                ...(read.data === undefined
                    ? {}
                    : { description: read.data.summary, meta: t("e2e", { passed, total }) }),
                trail: [[common.tabs.build, HARNESS_ROUTES.build]],
            }),
            slot: mapSlot(slotOfSwr(read), (build) =>
                build === undefined ? HARNESS_BUILD_PLACEHOLDER : buildViewOf(build, route.stage, words),
            ),
            placeholder: HARNESS_BUILD_PLACEHOLDER,
            slotLabels: slotLabels(t("missing")),
            labels: {
                stagesTitle: t("stagesTitle"),
                pullLabel: t("pullLabel"),
                pullDescription: t("pullDescription"),
                casesTitle: t("casesTitle"),
                caseColumn: t("caseColumn"),
                outcomeColumn: t("outcomeColumn"),
                detailColumn: t("detailColumn"),
                onlyOpenLabel: t("onlyOpenLabel"),
                onlyOpenDescription: t("onlyOpenDescription"),
                casesEmpty: t("casesEmpty"),
                logTitle: t("logTitle"),
                stepsTitle: t("stepsTitle"),
                lockedTitle: t("lockedTitle"),
                lockedText: t("lockedText"),
                keysLabel: t("keysLabel"),
                repoTitle: t("repoTitle"),
                repoText: t("repoText"),
                repoBound: t("repoBound"),
                repoUnbound: t("repoUnbound"),
                repoField: t("repoField"),
                repoPlaceholder: t("repoPlaceholder"),
                repoBind: t("repoBind"),
                repoFailed: t("repoFailed"),
                repoAudienceLabel: t("repoAudienceLabel"),
                repoAudienceDescription: t("repoAudienceDescription"),
            },
            common,
            isOnlyOpen,
            repository,
            isBinding: binder.isMutating,
            isBindFailed,
        },
        on: {
            retry: () => void read.mutate(),
            setOnlyOpen,
            changeRepository: (value) => {
                setRepository(value)
                setBindFailed(false)
            },
            bind: () => {
                setBindFailed(false)
                binder
                    .trigger({ buildId: route.buildId, repository: repository.trim() })
                    .then(() => read.mutate())
                    .catch(() => setBindFailed(true))
            },
        },
    }
}
