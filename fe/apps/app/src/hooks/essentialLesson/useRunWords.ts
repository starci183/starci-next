"use client"

import { useTranslations } from "next-intl"
import type { RunWords } from "@/modules/essential-runs"

/** The phrases the builders of Source, Scenarios and Apply use. */
export const useRunWords = (): RunWords => {
    const t = useTranslations("app.essentials.essential")
    return {
        scenarioStates: {
            none: t("scenarios.states.none"),
            running: t("scenarios.states.running"),
            passed: t("scenarios.states.passed"),
            failed: t("scenarios.states.failed"),
            guarded: t("scenarios.states.guarded"),
        },
        scenariosSummary: (green, total) => t("scenarios.summary", { green, total }),
        fixPrompt: (input) =>
            t("scenarios.promptTemplate", input)
                .split("\n")
                .filter((line) => line.trim() !== "")
                .join("\n"),
        noRunYet: t("apply.noRunYet"),
        levels: {
            easy: t("apply.levels.easy"),
            medium: t("apply.levels.medium"),
            hard: t("apply.levels.hard"),
            insane: t("apply.levels.insane"),
        },
        points: (points) => t("apply.points", { points }),
        pointsOf: (earned, max) => t("apply.pointsOf", { earned, max }),
        rungLabels: {
            locked: t("apply.rungs.locked"),
            open: t("apply.rungs.open"),
            doing: (score, max) => t("apply.rungs.doing", { score, max }),
            passed: (score, max) => t("apply.rungs.passed", { score, max }),
        },
        hiddenGreen: (green, total, score, max) => t("apply.hiddenGreen", { green, total, score, max }),
        applyPrimary: {
            run: (level) => t("apply.primary.run", { level }),
            rerun: (level) => t("apply.primary.rerun", { level }),
        },
    }
}
