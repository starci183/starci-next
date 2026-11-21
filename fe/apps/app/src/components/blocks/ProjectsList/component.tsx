import {
    Badge,
    Button,
    Cluster,
    EmptyNotice,
    Grid,
    Meter,
    Page,
    ProgressCircle,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { ArtImage, SlotView, areaArt } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"
import { SkeletonBlock } from "@/components/loading/SkeletonBlock"

/** Blank text of the width the skeleton needs: non-breaking spaces carry no readable word into the page or the accessibility tree. */
const blank = (width: number): string => " ".repeat(width)

/** One project as the table draws it, already in words. */
export type ProjectRowView = {
    readonly id: string
    readonly name: string
    readonly repo: string
    readonly kindLabel: string
    readonly isAgent: boolean
    readonly milestone: string
    readonly percent: number
    readonly proved: number
    readonly count: number
    readonly progress: string
    readonly ci: string
    readonly ciTone: "success" | "warning" | "muted"
    readonly isProved: boolean
    readonly href: string
}

/** The four figures of the ribbon, as numbers. */
export type ProjectsFiguresView = {
    readonly proved: number
    readonly practising: number
    readonly milestonesDone: number
    readonly milestonesTotal: number
    readonly cvLines: number
}

/** The projects as they are drawn: the ribbon figures and the table rows, already in words. */
export type ProjectsListView = {
    readonly figures: ProjectsFiguresView
    readonly rows: ReadonlyArray<ProjectRowView>
}

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PROJECTS_LIST_PLACEHOLDER: ProjectsListView = {
    figures: { proved: 0, practising: 0, milestonesDone: 0, milestonesTotal: 0, cvLines: 0 },
    rows: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        name: blank(10),
        repo: blank(16),
        kindLabel: "xxx",
        isAgent: false,
        milestone: blank(10),
        percent: 0,
        proved: 0,
        count: 0,
        progress: "x/x",
        ci: blank(6),
        ciTone: "muted",
        isProved: false,
        href: "",
    })),
}

/** The fixed words of the projects list. */
export type ProjectsListLabels = {
    readonly pageTitle: string
    readonly pageDescription: string
    readonly create: string
    readonly createHref: string
    readonly ribbonLabel: string
    readonly figures: {
        readonly proved: string
        readonly practising: string
        readonly milestones: string
        readonly cv: string
    }
    readonly listLabel: string
    readonly columns: {
        readonly project: string
        readonly kind: string
        readonly milestone: string
        readonly progress: string
        readonly ci: string
    }
    readonly progressLabel: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly note: string
    readonly addTitle: string
    readonly addText: string
}

/** Props for {@link ProjectsListBase}. */
export type ProjectsListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProjectsListView>
        readonly placeholder: ProjectsListView
        readonly slotLabels: SlotLabels
        readonly labels: ProjectsListLabels
        /** The public base of the statics, for the hero picture. */
        readonly staticsBaseUrl: string
    }
    readonly on: { readonly retry: () => void }
}

/** What the body needs: the page props, the list and whether it is the skeleton. */
type BodyProps = {
    readonly props: ProjectsListBaseProps["props"]
    readonly view: ProjectsListView
    readonly isLoading: boolean
}

/** The hero: the three figures of the learner beside the 3D picture of the area. */
const Hero = (props: BodyProps) => {
    const { figures } = props.view
    const { labels } = props.props
    return (
        <Grid
            kind="pair"
            leading={
                <Section
                    kind="figures"
                    ariaLabel={labels.ribbonLabel}
                    isLoading={props.isLoading}
                    items={[
                        { id: "proved", term: labels.figures.proved, value: figures.proved },
                        {
                            id: "milestones",
                            term: labels.figures.milestones,
                            value: figures.milestonesDone,
                            unit: `/ ${figures.milestonesTotal}`,
                        },
                        { id: "cv", term: labels.figures.cv, value: figures.cvLines },
                    ]}
                />
            }
            trailing={<ArtImage asset={areaArt("projects")} base={props.props.staticsBaseUrl} />}
        />
    )
}

/** One project as a card: the name, the proved ring, the kind and CI chips, and one segment per concept. */
const ProjectCard = (props: { readonly row: ProjectRowView; readonly progressLabel: string }) => {
    const { row } = props
    return (
        <SurfaceCard
            label={row.name}
            headingLevel={3}
            labelEnd={<ProgressCircle label={props.progressLabel} value={row.percent} size="sm" />}
            wholeAction={{ kind: "link", href: row.href, label: row.name }}
            {...(row.isProved ? { emphasis: "accent" as const } : {})}
        >
            <Stack gap="inline">
                <Text tone="muted">{[row.repo, row.milestone].filter((part) => part !== "").join(" · ")}</Text>
                <Cluster gap="inline" align="center" wrap>
                    <Badge tone="neutral">{row.kindLabel}</Badge>
                    <Badge isDot tone={row.ciTone}>
                        {row.ci}
                    </Badge>
                    <Text tone="muted" tabular>
                        {row.progress}
                    </Text>
                </Cluster>
                <Meter
                    label={props.progressLabel}
                    isLabelHidden
                    value={row.proved}
                    maxValue={Math.max(1, row.count)}
                    segments={Math.min(12, Math.max(2, row.count)) as 2}
                    tone={row.isProved ? "affirmative" : "informative"}
                    isLoading={row.href === ""}
                />
            </Stack>
        </SurfaceCard>
    )
}

/** The learner's projects as cards, with the dashed card that adds the next repo; the empty list is drawn in its place. */
const Cards = (props: BodyProps) => {
    const { labels, staticsBaseUrl } = props.props
    if (props.view.rows.length === 0) {
        return (
            <Stack gap="region">
                <ArtImage asset={areaArt("empty-projects")} base={staticsBaseUrl} />
                <EmptyNotice
                    message={labels.emptyTitle}
                    description={labels.emptyText}
                    actionLabel={labels.create}
                    actionHref={labels.createHref}
                    frame="frameless"
                />
            </Stack>
        )
    }
    return (
        <Section title={labels.listLabel} headingLevel={2} count={props.view.rows.length}>
            <Grid kind="cards" columns={3}>
                {props.view.rows.map((row) => (
                    <ProjectCard key={row.id} row={row} progressLabel={labels.progressLabel} />
                ))}
                <SurfaceCard
                    label={labels.addTitle}
                    headingLevel={3}
                    wholeAction={{ kind: "link", href: labels.createHref, label: labels.addTitle }}
                >
                    <Text tone="muted">{labels.addText}</Text>
                </SurfaceCard>
            </Grid>
        </Section>
    )
}

/**
 * Draws the projects page of a subscriber: the one primary (create a project), the hero with three figures and the 3D picture, and
 * one card per project. The read's state is drawn in place: a skeleton while it runs, the empty notice for none.
 */
export const ProjectsListBase = (props: ProjectsListBaseProps) => (
    <Page
        header={{
            breadcrumbs: "root",
            title: props.props.labels.pageTitle,
            description: props.props.labels.pageDescription,
            actions: (
                <Button intent="commit" startGlyph="plus" href={props.props.labels.createHref}>
                    {props.props.labels.create}
                </Button>
            ),
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) =>
                isLoading ? (
                    <Stack gap="region">
                        <SkeletonBlock lines={2} />
                        <SkeletonBlock lines={7} />
                    </Stack>
                ) : (
                    <Stack gap="region">
                        <Hero props={props.props} view={view} isLoading={isLoading} />
                        <Cards props={props.props} view={view} isLoading={isLoading} />
                    </Stack>
                )
            }
        />
    </Page>
)
