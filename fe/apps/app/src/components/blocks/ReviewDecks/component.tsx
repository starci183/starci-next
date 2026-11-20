import { Alert, EmptyNotice, Page, Section, Stack, Tabs, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { ReviewDeckRow, ReviewDecksScreen } from "@/hooks/reviewHub"

/** Props for {@link ReviewDecksBase}: the resolved screen of the decks. */
export type ReviewDecksBaseProps = {
    readonly props: ReviewDecksScreen["props"]
    readonly on: ReviewDecksScreen["on"]
}

/** One deck as a row: its name and one sentence, the cards, difficulty and tracks, the state and the one command; the row opens the deck. */
const rowOf = (deck: ReviewDeckRow, props: ReviewDecksBaseProps): ListRowData => ({
    id: deck.id,
    title: deck.title,
    description: `${deck.facts}${deck.tracks.length === 0 ? "" : ` · ${deck.tracks.join(", ")}`}`,
    href: deck.href,
    detail: deck.description,
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
                    />
                    <Tabs
                        kind="filter"
                        label={labels.trackLabel}
                        items={trackOptions}
                        selectedKey={track}
                        onSelect={props.on.setTrack}
                    />
                </>
            }
            items={props.rows.map((row) => rowOf(row, props))}
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

/**
 * Draws the decks: the header with the trail and the one rule (a daily cap from the goal), the added and not-added chips with the track
 * chips, and the decks as a flat list. There is no primary command: each row carries its own "Add deck", so nothing pretends to be one.
 */
export const ReviewDecksBase = (props: ReviewDecksBaseProps) => {
    const { header, labels } = props.props
    return (
        <Page
            isLoading={"isLoading" in props.props.slot}
            header={{
                title: header.title,
                titleScale: "standard",
                meta: header.meta,
                breadcrumbs: {
                    label: labels.breadcrumbs,
                    items: [
                        { id: "review", label: labels.root, href: header.rootHref },
                        { id: "decks", label: header.title },
                    ],
                },
            }}
        >
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                errorDescription={labels.errorText}
                onRetry={props.on.retry}
                render={(rows, isLoading) => (
                    <Stack gap="section">
                        <Note {...props} />
                        <DeckList {...props} rows={rows} isLoading={isLoading} />
                    </Stack>
                )}
            />
        </Page>
    )
}
