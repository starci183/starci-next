"use client"

import { useTranslations } from "next-intl"
import type { ApplyLabels, ScenariosLabels, SourceLabels } from "@starci-next/ui"
import type { RunWords } from "@/modules/essential-runs"
import { useApplyLabels } from "./useApplyLabels"
import { useRunWords } from "./useRunWords"
import { useScenariosLabels } from "./useScenariosLabels"
import { useSourceLabels } from "./useSourceLabels"

/** The words of the primary command of each part. */
type PrimaryLabels = {
    readonly run: string
    readonly check: string
    readonly next: string
    readonly running: string
    readonly failed: string
    readonly download: string
}

/** Every word of Source, Scenarios and Apply, and the phrases their builders use. */
export type EssentialRunLabels = {
    readonly source: SourceLabels
    readonly scenarios: ScenariosLabels
    readonly apply: ApplyLabels
    readonly words: RunWords
    readonly primary: PrimaryLabels
}

/** Resolves the words of the three parts that run on the machine of the learner. */
export const useEssentialRunLabels = (): EssentialRunLabels => {
    const t = useTranslations("app.essentials.essential")
    return {
        source: useSourceLabels(),
        scenarios: useScenariosLabels(),
        apply: useApplyLabels(),
        words: useRunWords(),
        primary: {
            run: t("scenarios.primary.run"),
            check: t("scenarios.primary.check"),
            next: t("scenarios.primary.next"),
            running: t("scenarios.primary.running"),
            failed: t("scenarios.primary.failed"),
            download: t("source.download"),
        },
    }
}
