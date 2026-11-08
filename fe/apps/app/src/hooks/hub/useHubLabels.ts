"use client"

import { useTranslations } from "next-intl"
import type { HubLabelSet } from "./hub.shared"

/** The weekly goals the learner may choose, as the back end accepts them. */
const GOAL_CHOICES: ReadonlyArray<number> = [2, 3, 4, 5, 6, 7]

/** Resolves the fixed words of the hub screen from the `app.hub` catalog; `status` is the result of the last goal save. */
export const useHubLabels = (status: string): HubLabelSet => {
    const t = useTranslations("app.hub")
    const guide = useTranslations("app.guide")
    return {
        pageTitle: t("pageTitle"),
        pageDescription: t("shards.subtitle"),
        path: {
            eyebrow: t("path.eyebrow"),
            nextLabel: t("path.nextLabel"),
            continue: t("path.continue"),
            change: t("path.change"),
            emptyTitle: t("path.emptyTitle"),
            emptyBody: t("path.emptyBody"),
            choose: t("path.choose"),
        },
        todayLabel: t("today.eyebrow"),
        todayEmpty: t("today.empty"),
        streak: {
            title: t("streak.title"),
            rule: t("streak.rule"),
            goalBar: t("streak.goalBar"),
            dayStripLabel: t("streak.title"),
        },
        goal: {
            open: t("streak.editGoal"),
            groupLabel: t("streak.goalLabel"),
            options: GOAL_CHOICES.map((days) => ({
                value: String(days),
                label: t("streak.goalOption", { count: days }),
            })),
            save: t("streak.goalSave"),
            cancel: t("streak.goalCancel"),
            status,
        },
        shardsTitle: t("shards.title"),
        shardsSubtitle: t("shards.subtitle"),
        shard: { open: t("shards.open"), soon: t("shards.soon") },
        layersTitle: t("layers.title"),
        layersSubtitle: t("layers.subtitle"),
        layerOpen: t("layers.open"),
        guide: {
            trigger: guide("open"),
            title: guide("title"),
            description: guide("description"),
            close: guide("close"),
        },
        signedOut: { title: t("signedOut.title"), body: t("signedOut.body"), action: t("signedOut.action") },
    }
}
