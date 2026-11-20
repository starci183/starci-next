import { EmptyNotice, Page } from "@starci/grammar/common"
import { IncidentGroups, SlotView, type IncidentGroupView } from "@starci-next/ui"
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
                badgeTone: "success" as const,
                href: "",
                cta: "",
            })),
        },
    ],
}

/** The fixed words of the page. */
export type IncidentsLabels = {
    readonly title: string
    readonly description: string
    /** The note that running an incident needs a connected device, which is not open yet. */
    readonly runnerNote: string
    readonly empty: string
    /** The page-level state when no incident is written yet. */
    readonly noneTitle: string
    readonly noneBody: string
    readonly noneAction: string
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
 * Draws the incident list: the header with the facts as its meta, then the written incidents grouped by topic. With none written the
 * whole page says so (an illustration, the words, the way to Essentials).
 */
export const IncidentsListBase = (props: IncidentsListBaseProps) => {
    const { slot, placeholder, slotLabels, labels } = props.props
    const meta = "items" in slot ? [...slot.items.facts, labels.runnerNote].join(" · ") : labels.runnerNote
    return (
        <Page header={{ title: labels.title, description: labels.description, meta, breadcrumbs: "root" }}>
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) =>
                    view.groups.length === 0 ? (
                        <EmptyNotice
                            scope="page"
                            message={labels.noneTitle}
                            description={labels.noneBody}
                            actionLabel={labels.noneAction}
                            actionHref="/essentials"
                            media={{ illustration: { staticsKey: "illustrations/empty/essentials-empty.png" } }}
                        />
                    ) : (
                        <IncidentGroups groups={view.groups} emptyLabel={labels.empty} isLoading={isLoading} />
                    )
                }
            />
        </Page>
    )
}
