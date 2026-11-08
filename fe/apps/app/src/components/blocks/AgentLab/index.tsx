"use client"

import { useLocale, useTranslations } from "next-intl"
import { AGENT_QUOTA_PLACEHOLDER, conceptRowsOf, quotaViewOf, trackTilesOf, useAgentWords } from "@/hooks/agents"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryAgentLabSwr, useQueryAgentQuotaSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { AGENT_LAB_PLACEHOLDER, AgentLabBase } from "./component"

/** The connected agent lab overview: reads the tracks, the mindset concepts and the model calls left today, and words every card. */
export const AgentLab = () => {
    const t = useTranslations("app.agents")
    const locale = useLocale()
    const read = useQueryAgentLabSwr(locale)
    const quota = useQueryAgentQuotaSwr()
    const words = useAgentWords()
    return (
        <AgentLabBase
            props={{
                slot: mapSlot(slotOfSwr(read), (overview) => ({
                    facts: [
                        t("factTools", { count: overview.tracks.length }),
                        t("factConcepts", { count: overview.concepts.length }),
                    ],
                    tracks: trackTilesOf(overview, words),
                    concepts: conceptRowsOf(overview, words),
                })),
                quota: mapSlot(slotOfSwr(quota), (value) => quotaViewOf(value, "starci-proxy", words)),
                placeholder: AGENT_LAB_PLACEHOLDER,
                quotaPlaceholder: AGENT_QUOTA_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    intro: { eyebrow: t("eyebrow"), title: t("heading"), description: t("description") },
                    tracksLabel: t("tracksLabel"),
                    openTrack: t("openTrack"),
                    conceptsLabel: t("conceptsLabel"),
                    conceptsEmpty: t("conceptsEmpty"),
                    quotaBarLabel: t("quota.barLabel"),
                    tools: { title: t("tools.title"), description: t("tools.description"), badge: t("tools.badge") },
                    harness: {
                        title: t("harness.title"),
                        description: t("harness.description"),
                        badge: t("harness.badge"),
                    },
                    proof: {
                        title: t("proof.title"),
                        description: t("proof.description"),
                        cta: t("proof.cta"),
                        href: APP_ROUTES.projects,
                    },
                },
            }}
            on={{ retry: () => void read.mutate(), retryQuota: () => void quota.mutate() }}
        />
    )
}
