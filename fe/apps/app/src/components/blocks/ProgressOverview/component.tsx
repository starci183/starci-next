import type { ReactNode } from "react"
import {
    Button,
    EmptyNotice,
    Link,
    Meter,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    Text,
    Timeline,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type {
    DataSlot,
    ProgressBlockView,
    ProgressFigureView,
    ProgressLabels,
    ProgressLinkView,
    ProgressListView,
    ProgressPageView,
    ProgressRowView,
    SlotLabels,
} from "@/modules/types"

/** The fake figures with the geometry of settled ones. */
const placeholderFigures = (id: string): ReadonlyArray<ProgressFigureView> =>
    [1, 2, 3, 4].map((index) => ({ id: `${id}-${index}`, term: "xxxxxx", value: 0 }))

/** The fake list with the geometry of a settled one. */
const placeholderList = (id: string): ProgressListView => ({
    id,
    title: "xxxxxx",
    rows: [1, 2].map((index) => ({ id: `${id}-${index}`, title: "xxxxxxxxxxxx", description: "xxxxxxxxxxxxxxxx" })),
    empty: "xxxxxx",
})

/** The fake progress with the geometry of a settled one. */
export const PROGRESS_PLACEHOLDER: ProgressPageView = {
    ribbon: placeholderFigures("ribbon"),
    essentials: { lists: [placeholderList("essentials-parts")] },
    harness: { lists: [placeholderList("harness-builds")] },
    projects: {
        figures: { title: "xxxxxx", items: placeholderFigures("projects") },
        lists: [placeholderList("projects")],
    },
    practice: null,
    review: { figures: { title: "xxxxxx", items: placeholderFigures("review") }, lists: [] },
    activity: [1, 2, 3].map((index) => ({
        id: `a${index}`,
        title: "xxxxxxxxxxxx",
        at: "2026-01-01T00:00:00.000Z",
        when: "xxxx",
    })),
    firstVisit: null,
    isFree: false,
}

/** Props for {@link ProgressOverviewBase}. */
export type ProgressOverviewBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ProgressPageView>
        readonly placeholder: ProgressPageView
        readonly slotLabels: SlotLabels
        readonly labels: ProgressLabels
    }
    readonly on: { readonly retry: () => void }
}

/** The head link of a section: a navigation link at the end of the head row. */
const headLinkOf = (link: ProgressLinkView) => (
    <Link variant="head" href={link.href}>
        {link.label}
    </Link>
)

/** The action prop of a section head: the link, or nothing. */
const actionOf = (link: ProgressLinkView | undefined): { readonly action?: ReactNode } =>
    link === undefined ? {} : { action: headLinkOf(link) }

/** A row of a list as the Grammar draws it: a row with a percent ends in a thin meter. */
const rowOf = (row: ProgressRowView, isLoading: boolean): ListRowData => {
    const { percent, ...data } = row
    if (percent === undefined) return data
    return {
        ...data,
        detail: <Meter label={row.title} isLabelHidden size="sm" value={percent} isLoading={isLoading} />,
    }
}

/** What one list section is drawn from. */
type ListSectionProps = {
    readonly list: ProgressListView
    readonly hasFigures: boolean
    readonly isLoading: boolean
}

/** One list of rows as a flat section; under a figures section it goes without its own head, and an empty list says why. */
const ListSection = (props: ListSectionProps) => {
    const rows = {
        kind: "list" as const,
        isLoading: props.isLoading,
        items: props.list.rows.map((row) => rowOf(row, props.isLoading)),
        empty: <Text tone="muted">{props.list.empty}</Text>,
        ...(props.list.caption === undefined ? {} : { caption: props.list.caption }),
    }
    if (props.hasFigures) return <Section {...rows} ariaLabel={props.list.title} />
    return <Section {...rows} title={props.list.title} headingLevel={2} {...actionOf(props.list.link)} />
}

/** What the figures of a part are drawn from. */
type FiguresSectionProps = { readonly figures: NonNullable<ProgressBlockView["figures"]>; readonly isLoading: boolean }

/** The figures of a part as a flat section. */
const FiguresSection = (props: FiguresSectionProps) => (
    <Section
        kind="figures"
        title={props.figures.title}
        headingLevel={2}
        isLoading={props.isLoading}
        items={props.figures.items}
        {...actionOf(props.figures.link)}
    />
)

/** What one part of the page is drawn from. */
type BlockSectionProps = {
    readonly view: ProgressBlockView | null
    readonly title: string
    readonly unavailable: string
    readonly retry: string
    readonly onRetry: () => void
    readonly isLoading: boolean
}

/** A part whose source failed: its title, the words and a retry, so one failed source never hides the rest. */
const UnavailableSection = (props: BlockSectionProps) => (
    <Section title={props.title} headingLevel={2}>
        <Stack gap="row">
            <Text tone="muted">{props.unavailable}</Text>
            <div>
                <Button intent="neutral" onPress={props.onRetry}>
                    {props.retry}
                </Button>
            </div>
        </Stack>
    </Section>
)

/** One part of the page: its figures, then its lists; a part whose source failed says so and nothing else. */
const BlockSection = (props: BlockSectionProps) => {
    if (props.view === null) return <UnavailableSection {...props} />
    const figures = props.view.figures
    return (
        <Stack gap="section">
            {figures === undefined ? null : <FiguresSection figures={figures} isLoading={props.isLoading} />}
            {props.view.lists.map((list) => (
                <ListSection key={list.id} list={list} hasFigures={figures !== undefined} isLoading={props.isLoading} />
            ))}
        </Stack>
    )
}

/** What the ready page is drawn from. */
type ReadyProps = {
    readonly view: ProgressPageView
    readonly labels: ProgressLabels
    readonly onRetry: () => void
    readonly isLoading: boolean
}

/** The recent activity as a timeline, or the words that nothing happened yet. */
const ActivitySection = (props: ReadyProps) => (
    <Section title={props.labels.activityTitle} headingLevel={2} isLoading={props.isLoading}>
        {props.view.activity.length === 0 ? (
            <Text tone="muted">{props.labels.activityEmpty}</Text>
        ) : (
            <Timeline
                label={props.labels.activityLabel}
                items={props.view.activity.map((entry) => ({
                    id: entry.id,
                    title: entry.title,
                    dateTime: entry.at,
                    timeLabel: entry.when,
                }))}
            />
        )}
    </Section>
)

/** The first visit: nothing is measured yet, which the page says once (an illustration, the words), then the three ways in. */
const FirstVisit = (props: ReadyProps) => (
    <Stack gap="region">
        <EmptyNotice
            scope="page"
            message={props.labels.firstVisitTitle}
            description={props.labels.firstVisitText}
            media={{ illustration: { staticsKey: "illustrations/empty/hoc-first-visit.png" } }}
        />
        <Section
            kind="list"
            ariaLabel={props.labels.firstVisitTitle}
            isLoading={props.isLoading}
            items={props.view.firstVisit ?? []}
            empty={<Text tone="muted">{props.labels.unavailable}</Text>}
        />
    </Stack>
)

/** The ready page: the ribbon on top, then Essentials, Harness, Projects, Luyện code and Ôn tập. */
const Ready = (props: ReadyProps) => {
    if (props.view.firstVisit !== null) return <FirstVisit {...props} />
    const common = {
        unavailable: props.labels.unavailable,
        retry: props.labels.retry,
        onRetry: props.onRetry,
        isLoading: props.isLoading,
    }
    return (
        <Stack gap="region">
            <Section
                kind="figures"
                ariaLabel={props.labels.ribbonLabel}
                items={props.view.ribbon}
                isLoading={props.isLoading}
            />
            <BlockSection {...common} view={props.view.essentials} title={props.labels.essentialsTitle} />
            <BlockSection {...common} view={props.view.harness} title={props.labels.harnessTitle} />
            <BlockSection {...common} view={props.view.projects} title={props.labels.projectsTitle} />
            <BlockSection {...common} view={props.view.practice} title={props.labels.practiceTitle} />
            <BlockSection {...common} view={props.view.review} title={props.labels.reviewTitle} />
        </Stack>
    )
}

/** The page description by what the learner has: free, first visit or the full line. */
const descriptionOf = (labels: ProgressLabels, slot: DataSlot<ProgressPageView>): string | undefined => {
    if ("isLoading" in slot) return labels.loading
    if (!("items" in slot)) return undefined
    const view = slot.items
    if (view.firstVisit !== null) return labels.descriptionFirst
    return view.isFree ? labels.descriptionFree : labels.description
}

/**
 * Draws Progress (the page across the whole app): a ribbon of figures, then Essentials (the parts the plan opens and a meter row per
 * topic), Harness (builds and the doctor), Projects (figures and projects for a subscriber, the pitch for anyone else), Luyện code
 * (Accepted problems and a meter row per pattern) and Ôn tập. The recent activity stands in a side pane, under the page at 390.
 * Every part is a flat section; one that cannot be read says so with its own retry.
 */
export const ProgressOverviewBase = (props: ProgressOverviewBaseProps) => {
    const labels = props.props.labels
    const slot = props.props.slot
    const description = descriptionOf(labels, slot)
    const hasAside = "isLoading" in slot || ("items" in slot && slot.items.firstVisit === null)
    const drawn = (render: (ready: ReadyProps) => ReactNode) => (
        <SlotView
            slot={slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) => render({ view, labels, onRetry: props.on.retry, isLoading })}
        />
    )
    return (
        <Page
            chrome="panes"
            header={{
                title: labels.title,
                titleScale: "standard",
                breadcrumbs: {
                    label: labels.crumbLabel,
                    items: [
                        { id: "profile", label: labels.crumbProfile, href: labels.crumbHref },
                        { id: "progress", label: labels.crumbSelf },
                    ],
                },
                ...(description === undefined ? {} : { description }),
            }}
        >
            <PaneGrid
                label={labels.title}
                areas={{ base: ["main", "aside"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: hasAside ? ["fill", "standard"] : ["fill"] }}
            >
                <Pane area="main" scroll label={labels.title}>
                    <PaneSection>
                        {drawn((ready) => (
                            <Ready {...ready} />
                        ))}
                    </PaneSection>
                </Pane>
                {hasAside ? (
                    <Pane area="aside" scroll label={labels.activityTitle}>
                        <PaneSection>
                            {drawn((ready) => (
                                <ActivitySection {...ready} />
                            ))}
                        </PaneSection>
                    </Pane>
                ) : null}
            </PaneGrid>
        </Page>
    )
}
