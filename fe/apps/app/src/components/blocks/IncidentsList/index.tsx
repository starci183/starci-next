"use client"

import { useLocale, useTranslations } from "next-intl"
import { authoredCountOf, incidentGroupsOf, useIncidentWords } from "@/hooks/incidents"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryIncidentsSwr } from "@/hooks/swr"
import { INCIDENTS_PLACEHOLDER, IncidentsListBase } from "./component"

/** The connected incident list: reads the live Essentials lessons with the status of their incident and words every row. */
export const IncidentsList = () => {
    const t = useTranslations("app.incidents")
    const locale = useLocale()
    const read = useQueryIncidentsSwr(locale)
    const words = useIncidentWords()
    return (
        <IncidentsListBase
            props={{
                slot: mapSlot(slotOfSwr(read), (rows) => ({
                    facts: [
                        t("factLessons", { count: rows.length }),
                        t("factAuthored", { count: authoredCountOf(rows) }),
                    ],
                    groups: incidentGroupsOf(rows, words),
                })),
                placeholder: INCIDENTS_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    intro: { eyebrow: t("eyebrow"), title: t("title"), description: t("description") },
                    runnerNote: t("runnerNote"),
                    empty: t("empty"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
