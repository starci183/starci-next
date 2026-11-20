import {
    Button,
    Grid,
    Heading,
    Illustration,
    Page,
    Stack,
    StaticsProvider,
    Text,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { IncidentGroups, SlotView, type IncidentGroupView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The incident list as it is drawn: the facts under the title and the topics with their lessons, every word resolved. */
export type IncidentsScreenView = {
    readonly facts: ReadonlyArray<string>
    readonly groups: ReadonlyArray<IncidentGroupView>
}

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const INCIDENTS_PLACEHOLDER: IncidentsScreenView = {
    // Stand-in words with the length of the real facts, so the meta skeleton keeps the width of a settled line.
    facts: ["0 bài học", "0 sự cố sẵn sàng"],
    groups: [
        {
            id: "placeholder",
            label: "",
            rows: [1, 2, 3].map((index) => ({
                id: `placeholder-${index}`,
                title: "",
                description: "",
                badge: "",
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
    /** The first crumb of the trail (the learn home) and the name of the trail landmark. */
    readonly crumbLearn: string
    readonly trailLabel: string
}

/** Props for {@link IncidentsListBase}. */
export type IncidentsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<IncidentsScreenView>
        readonly placeholder: IncidentsScreenView
        readonly slotLabels: SlotLabels
        readonly labels: IncidentsLabels
        /** Where the statics (the empty-page picture) are served from. */
        readonly staticsBaseUrl: string
    }
    readonly on: { readonly retry: () => void }
}

/** The page when no incident is written yet: the words and the way on beside the picture, so the page has no dead space. */
const NoneYet = (props: { readonly labels: IncidentsLabels; readonly isLoading: boolean }) => (
    <Grid
        kind="pair"
        leading={
            <Stack gap="region">
                <Stack gap="row">
                    <Heading level={2} scale="standard" isLoading={props.isLoading}>
                        {props.labels.noneTitle}
                    </Heading>
                    <Text as="p" tone="muted" isLoading={props.isLoading}>
                        {props.labels.noneBody}
                    </Text>
                </Stack>
                <Stack gap="row" align="start">
                    <Button intent="neutral" href="/essentials" isDisabled={props.isLoading}>
                        {props.labels.noneAction}
                    </Button>
                </Stack>
            </Stack>
        }
        trailing={
            <Illustration
                staticsKey="illustrations/empty/essentials-empty.png"
                ratio="4:3"
                loading="eager"
                isLoading={props.isLoading}
            />
        }
    />
)

/** The header of the page: the title, what it is and the facts of the read as its meta. */
const headerOf = (labels: IncidentsLabels, meta: string | undefined): PageHeaderContent => ({
    title: labels.title,
    description: `${labels.description} ${labels.runnerNote}`,
    breadcrumbs: {
        label: labels.trailLabel,
        items: [
            { id: "learn", label: labels.crumbLearn, href: "/" },
            { id: "incidents", label: labels.title },
        ],
    },
    ...(meta === undefined ? {} : { meta }),
})

/**
 * Draws the incident list: the header with the facts as its meta, then the written incidents grouped by topic. With none written the
 * whole page says so (the words, the way to Essentials and a picture).
 */
export const IncidentsListBase = (props: IncidentsListBaseProps) => {
    const { slot, placeholder, slotLabels, labels } = props.props
    return (
        <SlotView<IncidentsScreenView, PageHeaderContent>
            slot={slot}
            placeholder={placeholder}
            labels={slotLabels}
            onRetry={props.on.retry}
            header={(view) => headerOf(labels, view.facts.join(" · "))}
            headerFallback={headerOf(labels, undefined)}
            render={(view, isLoading) =>
                view.groups.length === 0 ? (
                    <StaticsProvider baseUrl={props.props.staticsBaseUrl}>
                        <NoneYet labels={labels} isLoading={isLoading} />
                    </StaticsProvider>
                ) : (
                    <IncidentGroups groups={view.groups} emptyLabel={labels.empty} isLoading={isLoading} />
                )
            }
            frame={(parts) => (
                <Page header={parts.header} isLoading={parts.isLoading}>
                    {parts.body}
                </Page>
            )}
        />
    )
}
