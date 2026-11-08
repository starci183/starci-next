import { Badge, Button, Cluster, Page, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { CatalogIntro, PracticeList, SlotView, type PracticeRow } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The projects as they are drawn: the rows of the list, already in words. */
export type ProjectsListView = { readonly rows: ReadonlyArray<PracticeRow> }

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECTS_LIST_PLACEHOLDER: ProjectsListView = {
    rows: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted" as const,
        href: "",
        cta: "xxxxxx",
        isCurrent: false,
    })),
}

/** The fixed words of the projects list. */
export type ProjectsListLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly create: string
    readonly createHref: string
    readonly listLabel: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly device: {
        readonly title: string
        readonly badge: string
        readonly text: string
        readonly practice: string
        readonly practiceNote: string
        readonly proof: string
        readonly proofNote: string
    }
}

/** Props for {@link ProjectsListBase}. */
export type ProjectsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectsListView>
        readonly placeholder: ProjectsListView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectsListLabels
    }
    readonly on: { readonly retry: () => void }
}

/** What the machine card needs. */
type DeviceCardProps = { readonly labels: ProjectsListLabels["device"] }

/** The card of the learner machine: a placeholder until devices exist, with the two states practice and proof told apart. */
const DeviceCard = (props: DeviceCardProps) => (
    <SurfaceCard label={props.labels.title}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Badge tone="muted">{props.labels.badge}</Badge>
            </Cluster>
            <Text tone="muted">{props.labels.text}</Text>
            <Stack gap="inline">
                <Text size="sm">
                    {props.labels.practice}: {props.labels.practiceNote}
                </Text>
                <Text size="sm">
                    {props.labels.proof}: {props.labels.proofNote}
                </Text>
            </Stack>
        </Stack>
    </SurfaceCard>
)

/** Draws the projects of the learner: the intro with the way to create one, the list and the placeholder card of the machine. */
export const ProjectsListBase = (props: ProjectsListBaseProps) => (
    <Page>
        <Stack gap="region">
            <CatalogIntro
                eyebrow={props.props.labels.eyebrow}
                title={props.props.labels.title}
                description={props.props.labels.description}
                facts={[]}
                upsell={undefined}
            />
            <Cluster gap="inline" wrap>
                <Button intent="commit" href={props.props.labels.createHref}>
                    {props.props.labels.create}
                </Button>
            </Cluster>
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => (
                    <PracticeList
                        label={props.props.labels.listLabel}
                        emptyLabel={props.props.labels.emptyText}
                        rows={view.rows}
                        isLoading={isLoading}
                    />
                )}
            />
            <DeviceCard labels={props.props.labels.device} />
        </Stack>
    </Page>
)
