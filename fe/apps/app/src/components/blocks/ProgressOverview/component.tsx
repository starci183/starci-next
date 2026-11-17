import type { ReactNode } from "react"
import { Link, Page, Section, Stack, Text, Timeline } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type {
    DataSlot,
    ProgressBlockView,
    ProgressFigureView,
    ProgressLabels,
    ProgressLinkView,
    ProgressListView,
    ProgressPageView,
    SlotLabels,
} from "@/modules/types"

/** The fake figures with the geometry of settled ones. */
const placeholderFigures = (id: string): ReadonlyArray<ProgressFigureView> =>
    [1, 2, 3, 4].map((index) => ({ id: `${id}-${index}`, term: "xxxxxx", value: 0 }))

/** The fake list with the geometry of a settled one. */
const placeholderList = (id: string): ProgressListView => ({
    id,
    title: "xxxxxx",
    fact: "xx",
    rows: [1, 2].map((index) => ({ id: `${id}-${index}`, title: "xxxxxxxxxxxx", description: "xxxxxxxxxxxxxxxx" })),
    empty: "xxxxxx",
})

/** The fake progress with the geometry of a settled one. */
export const PROGRESS_PLACEHOLDER: ProgressPageView = {
    ribbon: placeholderFigures("ribbon"),
    essentials: { lists: [placeholderList("essentials-parts"), placeholderList("essentials-topic")] },
    harness: { lists: [placeholderList("harness-builds")] },
    projects: {
        figures: { title: "xxxxxx", items: placeholderFigures("projects") },
        lists: [placeholderList("projects")],
    },
    review: { figures: { title: "xxxxxx", items: placeholderFigures("review") }, lists: [] },
    activity: [1, 2, 3].map((index) => ({
        id: `a${index}`,
        title: "xxxxxxxxxxxx",
        at: "2026-01-01T00:00:00.000Z",
        when: "xxxx",
    })),
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

/** The outline rank of a list: the first section of a block sits under the page title, the rest under it. */
const levelOf = (hasFigures: boolean, index: number): 2 | 3 => {
    if (hasFigures) return 3
    return index === 0 ? 2 : 3
}

/** What one list section is drawn from. */
type ListSectionProps = { readonly list: ProgressListView; readonly level: 2 | 3; readonly isLoading: boolean }

/** One list of rows as a flat section; a list with no rows says why in its own words. */
const ListSection = (props: ListSectionProps) => (
    <Section
        kind="list"
        title={props.list.title}
        headingLevel={props.level}
        isLoading={props.isLoading}
        {...(props.list.fact === undefined ? {} : { fact: props.list.fact })}
        {...(props.list.caption === undefined ? {} : { caption: props.list.caption })}
        {...actionOf(props.list.link)}
        items={props.list.rows}
        empty={<Text tone="muted">{props.list.empty}</Text>}
    />
)

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
    readonly isLoading: boolean
}

/** One part of the page: its figures, then its lists; a part whose source failed says so and nothing else. */
const BlockSection = (props: BlockSectionProps) => {
    if (props.view === null) {
        return (
            <Section title={props.title} headingLevel={2}>
                <Text tone="muted">{props.unavailable}</Text>
            </Section>
        )
    }
    const figures = props.view.figures
    return (
        <Stack gap="section">
            {figures === undefined ? null : <FiguresSection figures={figures} isLoading={props.isLoading} />}
            {props.view.lists.map((list, index) => (
                <ListSection
                    key={list.id}
                    list={list}
                    level={levelOf(figures !== undefined, index)}
                    isLoading={props.isLoading}
                />
            ))}
        </Stack>
    )
}

/** What the ready page is drawn from. */
type ReadyProps = { readonly view: ProgressPageView; readonly labels: ProgressLabels; readonly isLoading: boolean }

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

/** The ready page: the ribbon on top, then Essentials, Harness, Projects and Review, then the recent activity. */
const Ready = (props: ReadyProps) => {
    const common = { unavailable: props.labels.unavailable, isLoading: props.isLoading }
    return (
        <Stack gap="region">
            <Section
                kind="figures"
                ribbon
                ariaLabel={props.labels.ribbonLabel}
                items={props.view.ribbon}
                isLoading={props.isLoading}
            />
            <BlockSection {...common} view={props.view.essentials} title={props.labels.essentialsTitle} />
            <BlockSection {...common} view={props.view.harness} title={props.labels.harnessTitle} />
            <BlockSection {...common} view={props.view.projects} title={props.labels.projectsTitle} />
            <BlockSection {...common} view={props.view.review} title={props.labels.reviewTitle} />
            <ActivitySection {...props} />
        </Stack>
    )
}

/**
 * Draws Progress (the page across the whole app): a ribbon of four figures, then Essentials (the parts the plan opens, each topic with
 * its lessons and the opener before and after), Harness (builds, doctor and trial verdicts), Projects (figures and projects for a
 * subscriber, the pitch for anyone else), Review and the recent activity. Every part is a flat section; nothing is a card.
 */
export const ProgressOverviewBase = (props: ProgressOverviewBaseProps) => (
    <Page
        header={{
            title: props.props.labels.title,
            titleScale: "standard",
            description: props.props.labels.description,
            breadcrumbs: "root",
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) => <Ready view={view} labels={props.props.labels} isLoading={isLoading} />}
        />
    </Page>
)
