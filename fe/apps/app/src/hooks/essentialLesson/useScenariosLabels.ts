"use client"

import { useTranslations } from "next-intl"
import type { ScenariosLabels } from "@starci-next/ui"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"

/** The words of the Scenarios part. */
export const useScenariosLabels = (): ScenariosLabels => {
    const t = useTranslations("app.essentials.essential.scenarios")
    const journey = useLessonJourneyLabels()
    return {
        markdown: journey.markdown,
        list: t("list"),
        empty: t("empty"),
        machineOnline: (name) => t("machineOnline", { name }),
        machineNone: t("machineNone"),
        machineNoneNote: t("machineNoneNote"),
        relayNote: t("relayNote"),
        noRun: t("noRun"),
        why: t("why"),
        ruleBroken: t("ruleBroken"),
        kept: t("kept"),
        hintTitle: t("hintTitle"),
        hintLocked: t("hintLocked"),
        hintNote: t("hintNote"),
        hintReveal: t("hintReveal"),
        fixTitle: t("fixTitle"),
        fixNote: t("fixNote"),
        fixPrompt: t("fixPrompt"),
        fixCopy: t("fixCopy"),
        guardTitle: (rule) => t("guardTitle", { rule }),
        guardNote: (flag) => t("guardNote", { flag }),
        flow: t("flow"),
        ask: {
            title: t("ask.title"),
            badge: t("ask.badge"),
            note: t("ask.note"),
            connect: t("ask.connect"),
        },
    }
}
