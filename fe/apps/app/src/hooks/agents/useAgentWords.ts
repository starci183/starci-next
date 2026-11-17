"use client"

import { useFormatter, useTranslations } from "next-intl"
import type { AgentWords } from "./agents.shared"

/** Resolves the words the agent lab views are built with. */
export const useAgentWords = (): AgentWords => {
    const t = useTranslations("app.agents")
    const format = useFormatter()
    return {
        keyMode: { byo: t("keyByo"), "starci-proxy": t("keyProxy") },
        pinned: (version) => (version === null ? t("pinnedNone") : t("pinned", { version })),
        labFacts: (count, open) => (count === 0 ? t("labsNone") : t("labFacts", { count, open })),
        conceptFree: t("conceptFree"),
        status: {
            "being-written": t("status.beingWritten"),
            draft: t("status.draft"),
            approved: t("status.approved"),
            outdated: t("status.outdated"),
        },
        locked: t("locked"),
        beingWritten: t("beingWritten"),
        quota: {
            remainingTitle: (remaining) => t("quota.remainingTitle", { remaining }),
            remainingText: t("quota.remainingText"),
            stoppedTitle: t("quota.stoppedTitle"),
            stoppedText: (time) => t("quota.stoppedText", { time }),
            ownTitle: t("quota.ownTitle"),
            ownText: t("quota.ownText"),
            barLabel: t("quota.barLabel"),
            valueText: (remaining, limit) => t("quota.valueText", { remaining, limit }),
        },
        timeOf: (iso) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" }),
    }
}
