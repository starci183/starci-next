import { Skeleton } from "@heroui/react"
import {
    Alert,
    EmptyNotice,
    Page,
    Section,
    Stack,
    Tabs,
    Text,
    type ListRowData,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import { SkeletonRows } from "../LoadingShapes"
import type { ReviewDeckRow, ReviewDecksScreen } from "@/hooks/reviewHub"

/** Props for {@link ReviewDecksBase}: the resolved screen of the decks. */
export type ReviewDecksBaseProps = {
    readonly props: ReviewDecksScreen["props"]
    readonly on: ReviewDecksScreen["on"]
}

/** One deck as a row: its name and one sentence, the cards, difficulty and tracks, the state and the one command; the row opens the deck. */
const rowOf = (deck: ReviewDeckRow, props: ReviewDecksBaseProps, isLoading: boolean): ListRowData => ({
    id: deck.id,
    title: deck.title,
    description: deck.facts,
    href: deck.href,
    detail: (
        <Stack gap="identity">
            {deck.tracks.length === 0 ? null : (
                <Text size="xs" tone="muted" isLoading={isLoading}>
                    {deck.tracks.join(", ")}
                </Text>
            )}
            <Text tone="muted" isLoading={isLoading}>
                {deck.description}
            </Text>
        </Stack>
    ),
    ...(deck.isAdded ? { badges: [{ label: props.props.labels.added, tone: "success" as const }] } : {}),
    action: {
        label: deck.isAdded ? props.props.labels.remove : props.props.labels.add,
        intent: "neutral",
        isPending: deck.isPending,
        press: () => props.on.toggle(deck.id),
    },
    actionPlacement: "end",
})

/** The note after an add: what was added and the way to undo it. */
const Note = (props: ReviewDecksBaseProps) => {
    const { note, labels } = props.props
    if (note === null) return null
    return note.isFailed ? (
        <Alert tone="negative" title={note.title} />
    ) : (
        <Alert
            tone="affirmative"
            title={note.title}
            description={note.text}
            action={{ label: labels.undo, onAction: props.on.undo }}
        />
    )
}

/** The decks as one flat list under the two chip rows; a filter with no deck says so. */
const DeckList = (
    props: ReviewDecksBaseProps & { readonly rows: ReadonlyArray<ReviewDeckRow>; readonly isLoading: boolean },
) => {
    const { labels, filter, filterOptions, track, trackOptions } = props.props
    return (
        <Section
            kind="list"
            title={labels.listTitle}
            headingLevel={2}
            count={props.rows.length}
            isLoading={props.isLoading}
            filter={
                <>
                    <Tabs
                        kind="filter"
                        label={labels.filterLabel}
                        items={filterOptions}
                        selectedKey={filter}
                        onSelect={props.on.setFilter}
                        scrollPreviousLabel={labels.scrollPrevious}
                        scrollNextLabel={labels.scrollNext}
                    />
                    <Tabs
                        kind="filter"
                        label={labels.trackLabel}
                        items={trackOptions}
                        selectedKey={track}
                        onSelect={props.on.setTrack}
                        scrollPreviousLabel={labels.scrollPrevious}
                        scrollNextLabel={labels.scrollNext}
                    />
                </>
            }
            items={props.rows.map((row) => rowOf(row, props, props.isLoading))}
            empty={
                <EmptyNotice
                    message={labels.emptyAdded}
                    description={labels.emptyAddedText}
                    actionLabel={labels.emptyAddedAction}
                    onAction={props.on.showAll}
                    frame="frameless"
                />
            }
        />
    )
}

/** The decks while their first read loads: the filter rows and the deck rows as bars, with no title or chip word. */
const DecksSkeleton = () => (
    <Stack gap="section">
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <SkeletonRows rows={6} />
    </Stack>
)

/**
 * Draws the decks: the header with the trail and the one rule (a daily cap from the goal), the added and not-added chips with the track
 * chips, and the decks as a flat list. There is no primary command: each row carries its own "Add deck", so nothing pretends to be one.
 */
export const ReviewDecksBase = (props: ReviewDecksBaseProps) => {
    const { header, labels } = props.props
    const pageHeaderOf = (loading: boolean): PageHeaderContent => ({
        title: header.title,
        titleScale: "standard",
        meta: loading ? <Skeleton className="h-3 w-56 rounded-md" /> : header.meta,
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [
                { id: "review", label: labels.root, href: header.rootHref },
                { id: "decks", label: header.title },
            ],
        },
    })
    return (
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            errorDescription={labels.errorText}
            onRetry={props.on.retry}
            render={(rows, isLoading) =>
                isLoading ? (
                    <DecksSkeleton />
                ) : (
                    <Stack gap="section">
                        <Note {...props} />
                        <DeckList {...props} rows={rows} isLoading={isLoading} />
                    </Stack>
                )
            }
            frame={(parts) => <Page header={pageHeaderOf(parts.isLoading)}>{parts.body}</Page>}
        />
    )
}
