"use client"

import { useLocale, useTranslations } from "next-intl"
import { AGENT_QUOTA_PLACEHOLDER, isTrackMissing, labCellsOf, quotaViewOf, useAgentWords } from "@/hooks/agents"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryAgentLabTrackSwr, useQueryAgentQuotaSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { AGENT_TRACK_PLACEHOLDER, AgentTrackBase } from "./component"

/** What the route hands the track block: the segment of the address. */
type AgentTrackProps = { readonly trackId: string }

/** The connected track screen: reads the track with its labs and the model calls left today, and words every row. */
export const AgentTrack = (props: AgentTrackProps) => {
    const t = useTranslations("app.agents")
    const locale = useLocale()
    const read = useQueryAgentLabTrackSwr(props.trackId, locale)
    const quota = useQueryAgentQuotaSwr()
    const words = useAgentWords()
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.label} · ${t("pageTitle")}`)
    return (
        <AgentTrackBase
            props={{
                slot: mapSlot(slotOfSwr(read), (track) => ({
                    title: track.label,
                    description: track.focus,
                    facts: [
                        words.keyMode[track.keyMode] ?? track.keyMode,
                        words.pinned(track.pinnedVersion),
                        words.labFacts(track.labCount, track.openLabCount),
                    ],
                    keyMode: track.keyMode,
                    cells: labCellsOf(track, words),
                })),
                quota: mapSlot(slotOfSwr(quota), (value) =>
                    quotaViewOf(value, read.data?.keyMode ?? "starci-proxy", words),
                ),
                isNotFound: isTrackMissing(read.error),
                placeholder: AGENT_TRACK_PLACEHOLDER,
                quotaPlaceholder: AGENT_QUOTA_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    eyebrow: t("track.eyebrow"),
                    back: t("track.back"),
                    backHref: APP_ROUTES.agents,
                    labsLabel: t("track.labsLabel"),
                    labsEmpty: t("track.labsEmpty"),
                    sourceLabel: t("track.sourceLabel"),
                    quotaBarLabel: t("quota.barLabel"),
                    notFound: t("track.notFound"),
                    notFoundText: t("track.notFoundText"),
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
