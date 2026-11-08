import { Page, Stack, Text } from "@starci/grammar/common"
import { CatalogIntro, IncidentGroups, SlotView, type IncidentGroupView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The incident list as it is drawn: the facts under the title and the topics with their lessons, every word resolved. */
export type IncidentsScreenView = {
    readonly facts: ReadonlyArray<string>
    readonly groups: ReadonlyArray<IncidentGroupView>
}

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const INCIDENTS_PLACEHOLDER: IncidentsScreenView = {
    facts: ["xxxxxx", "xxxxxxxx"],
    groups: [
        {
            id: "placeholder",
            label: "xxxxxxxxxx",
            rows: [1, 2, 3].map((index) => ({
                id: `placeholder-${index}`,
                title: "xxxxxxxxxx",
                description: "xxxxxxxx",
                badge: "xxxxxx",
                badgeTone: "muted" as const,
                href: "",
                cta: "",
            })),
        },
    ],
}

/** The fixed words of the page. */
export type IncidentsLabels = {
    readonly intro: { readonly eyebrow: string; readonly title: string; readonly description: string }
    /** The note that running an incident needs a connected device, which is not open yet. */
    readonly runnerNote: string
    readonly empty: string
}

/** Props for {@link IncidentsListBase}. */
export type IncidentsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<IncidentsScreenView>
        readonly placeholder: IncidentsScreenView
        readonly slotLabels: SlotLabels
        readonly labels: IncidentsLabels
    }
    readonly on: { readonly retry: () => void }
}

/**
 * Draws the incident list: the intro, then the Essentials lessons grouped by topic, each with the status of its tier-2 incident.
 * No incident is written yet, so every row says it is coming soon and links nowhere.
 */
export const IncidentsListBase = (props: IncidentsListBaseProps) => {
    const { slot, placeholder, slotLabels, labels } = props.props
    return (
        <Page>
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => (
                    <Stack gap="region">
                        <CatalogIntro {...labels.intro} facts={view.facts} upsell={undefined} />
                        <Text tone="muted">{labels.runnerNote}</Text>
                        <IncidentGroups groups={view.groups} emptyLabel={labels.empty} isLoading={isLoading} />
                    </Stack>
                )}
            />
        </Page>
    )
}
