"use client"

import { useTranslations } from "next-intl"
import type { SourceLabels } from "@starci-next/ui"

/** The words of the Source part. */
export const useSourceLabels = (): SourceLabels => {
    const t = useTranslations("app.essentials.essential.source")
    return {
        pullTitle: t("pullTitle"),
        pullNote: t("pullNote"),
        machineOnline: (name) => t("machineOnline", { name }),
        machineNone: t("machineNone"),
        machineNoneNote: t("machineNoneNote"),
        upFailed: t("upFailed"),
        architecture: t("architecture"),
        diagram: t("diagram"),
        diagramError: t("diagramError"),
        components: t("components"),
        component: t("component"),
        port: t("port"),
        rules: t("rules"),
        why: t("why"),
        empty: t("empty"),
        download: t("download"),
        copy: t("copy"),
        aside: {
            inSource: t("aside.inSource"),
            notIncludedTitle: t("aside.notIncludedTitle"),
            notIncluded: t("aside.notIncluded"),
            needsTitle: t("aside.needsTitle"),
            needs: t("aside.needs"),
        },
    }
}
