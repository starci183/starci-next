"use client"

import { useTranslations } from "next-intl"
import type { PathsLabelSet } from "./paths.shared"

/** Resolves the fixed words of the goal screen from the `app.paths` catalog. */
export const usePathsLabels = (): PathsLabelSet => {
    const t = useTranslations("app.paths")
    return {
        intro: { eyebrow: t("eyebrow"), title: t("title"), description: t("description") },
        stages: [
            t("stage.understand"),
            t("stage.remember"),
            t("stage.solve"),
            t("stage.build"),
            t("stage.buildAi"),
            t("stage.interview"),
            t("stage.prove"),
        ],
        note: t("note"),
        empty: t("empty"),
        card: {
            current: t("card.current"),
            doneLabel: t("card.doneLabel"),
            view: t("card.view"),
            choose: t("card.choose"),
            switchTo: t("card.switchTo"),
        },
        dialog: {
            doneTitle: t("dialog.doneTitle"),
            checksTitle: t("dialog.checksTitle"),
            checksNote: t("dialog.checksNote"),
            selfReported: t("dialog.selfReported"),
            stagesTitle: t("dialog.stagesTitle"),
            timeline: t("dialog.timeline"),
            close: t("dialog.close"),
            choose: t("card.choose"),
            switchTo: t("card.switchTo"),
            current: t("card.current"),
        },
        switchConfirm: {
            title: t("switchConfirm.title"),
            body: t("switchConfirm.body"),
            confirm: t("switchConfirm.confirm"),
            cancel: t("switchConfirm.cancel"),
        },
        signedOut: { title: t("signedOut.title"), body: t("signedOut.body"), action: t("signedOut.action") },
    }
}
