import {
    Alert,
    AlertDialog,
    Badge,
    Button,
    Cluster,
    EmptyNotice,
    Page,
    Section,
    Stack,
    Switch,
    SurfaceCard,
    Tabs,
    Text,
    Textarea,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, ExperienceCardView, ExperienceListView, SlotLabels } from "@/modules/types"

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const EXPERIENCE_PLACEHOLDER: ExperienceListView = {
    meta: "xxxxxx",
    tabs: [{ id: "all", label: "xxxxxx", count: 0 }],
    sources: [{ id: "all", label: "xxxxxx", count: 0 }],
    cards: [1, 2].map((index) => ({
        itemId: `placeholder-${index}`,
        source: "xxxxxx",
        state: "xxxxxx",
        stateTone: "neutral" as const,
        dateText: "xxxxxx",
        title: "xxxxxxxxxxxxxxxxxxxxxxxx",
        subtitle: "xxxxxxxxxxxx",
        tags: [{ id: "e", label: "xxxxxx" }],
        returnNote: undefined,
        note: undefined,
        edit: undefined,
        verified: undefined,
        notice: undefined,
        isBusy: false,
        isEditing: false,
        isReturned: false,
    })),
    ways: undefined,
    claims: [],
    confirmLine: undefined,
}

/** The fixed words of the page. */
export type ExperienceListLabels = {
    readonly title: string
    readonly loading: string
    readonly crumbLabel: string
    readonly crumbProfile: string
    readonly crumbHref: string
    readonly tabsLabel: string
    readonly sourcesLabel: string
    readonly firstTitle: string
    readonly firstText: string
    readonly waysLabel: string
    readonly emptyTabTitle: string
    readonly emptyTabText: string
    readonly showAll: string
    readonly returnedNote: string
    readonly sendHint: string
    readonly editVi: string
    readonly editEn: string
    readonly reopen: string
    readonly shown: string
    readonly hidden: string
    readonly copyLink: string
    readonly copiedLink: string
    readonly confirmTitle: string
    readonly confirmText: string
    readonly confirmAction: string
    readonly confirmCancel: string
    readonly claimsTitle: string
    readonly claimAction: string
}

/** What the reader does on the list. */
export type ExperienceListActions = {
    readonly retry: () => void
    readonly selectTab: (tab: string) => void
    readonly selectSource: (source: string) => void
    readonly editLine: (itemId: string, locale: "vi" | "en", text: string) => void
    readonly startEdit: (itemId: string) => void
    readonly askSend: (itemId: string) => void
    readonly confirmSend: () => void
    readonly cancelSend: () => void
    readonly toggleShown: (itemId: string) => void
    readonly copyLink: (itemId: string, url: string) => void
    readonly claim: (patternId: string) => void
}

/** What one card is drawn from: the card, the fixed words and the actions. */
type ExperienceCardProps = {
    readonly card: ExperienceCardView
    readonly labels: ExperienceListLabels
    readonly on: ExperienceListActions
    readonly isLoading: boolean
}

/** Props for {@link ExperienceListBase}. */
export type ExperienceListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ExperienceListView>
        readonly placeholder: ExperienceListView
        readonly slotLabels: SlotLabels
        readonly labels: ExperienceListLabels
        /** The event line under the title; undefined while nothing is known. */
        readonly meta: string | undefined
        /** The state tabs of the header, only once the list is settled and holds an item. */
        readonly tabs:
            ReadonlyArray<{ readonly id: string; readonly label: string; readonly count: number }> | undefined
        /** The CV line a send is confirmed with. */
        readonly confirmLine: string | undefined
        readonly tab: string
        readonly source: string
        readonly isConfirmOpen: boolean
    }
    readonly on: ExperienceListActions
}

/** The editor of a sendable item: both lines, what the AI graded, and Send for review. */
const CardEdit = (props: ExperienceCardProps) => {
    const { card, labels, on } = props
    if (card.edit === undefined) return null
    return (
        <Stack gap="row">
            <Textarea
                label={labels.editVi}
                value={card.edit.vi}
                rows={2}
                onValueChange={(text) => on.editLine(card.itemId, "vi", text)}
            />
            <Textarea
                label={labels.editEn}
                value={card.edit.en}
                rows={2}
                onValueChange={(text) => on.editLine(card.itemId, "en", text)}
            />
            <Cluster gap="inline" wrap>
                {card.edit.chips.map((chip) => (
                    <Badge key={chip.id} tone="neutral">
                        {chip.label}
                    </Badge>
                ))}
            </Cluster>
            <Cluster gap="inline" wrap align="center">
                <Button intent="neutral" isPending={card.isBusy} onPress={() => on.askSend(card.itemId)}>
                    {card.edit.sendLabel}
                </Button>
                <Text tone="muted">{labels.sendHint}</Text>
            </Cluster>
        </Stack>
    )
}

/** The profile switch and the copy command of a verified item. */
const CardVerified = (props: ExperienceCardProps) => {
    const { card, labels, on } = props
    if (card.verified === undefined) return null
    const verified = card.verified
    return (
        <Cluster gap="inline" wrap align="center">
            <Switch
                label={verified.isShown ? labels.shown : labels.hidden}
                isLabelHidden
                isSelected={verified.isShown}
                isDisabled={card.isBusy}
                onSelectedChange={() => on.toggleShown(card.itemId)}
            />
            <Text tone="muted">{verified.isShown ? labels.shown : labels.hidden}</Text>
            <Button intent="neutral" onPress={() => on.copyLink(card.itemId, verified.url)}>
                {verified.isCopied ? labels.copiedLink : labels.copyLink}
            </Button>
        </Cluster>
    )
}

/** One item: source and state with its date, the title, the chips, the returned note, then the next action. */
const ExperienceCardBody = (props: ExperienceCardProps) => {
    const { card, labels, on } = props
    return (
        <Stack gap="row">
            <Cluster gap="inline" wrap justify="between" align="center">
                <Cluster gap="inline" wrap align="center">
                    <Badge tone="neutral">{card.source}</Badge>
                    <Badge tone={card.stateTone}>{card.state}</Badge>
                </Cluster>
                <Text tone="muted">{card.dateText}</Text>
            </Cluster>
            {card.subtitle === undefined ? null : <Text tone="muted">{card.subtitle}</Text>}
            {card.returnNote === undefined ? null : (
                <Alert tone="cautionary" title={labels.returnedNote} description={card.returnNote} />
            )}
            {card.tags.length === 0 ? null : (
                <Cluster gap="inline" wrap>
                    {card.tags.map((chip) => (
                        <Badge key={chip.id} tone="neutral">
                            {chip.label}
                        </Badge>
                    ))}
                </Cluster>
            )}
            {card.note === undefined ? null : <Text tone="muted">{card.note}</Text>}
            <CardEdit {...props} />
            {card.isReturned && !card.isEditing ? (
                <div>
                    <Button intent="neutral" onPress={() => on.startEdit(card.itemId)}>
                        {labels.reopen}
                    </Button>
                </div>
            ) : null}
            <CardVerified {...props} />
            {card.notice === undefined ? null : <Alert tone="negative" title={card.notice} />}
        </Stack>
    )
}

/** One item as a thin-bordered card. */
const ExperienceCard = (props: ExperienceCardProps) => (
    <SurfaceCard label={props.card.title} headingLevel={3} height="fill" isLoading={props.isLoading}>
        <ExperienceCardBody {...props} />
    </SurfaceCard>
)

/** What the ready list is drawn from. */
type ReadyProps = {
    readonly view: ExperienceListView
    readonly labels: ExperienceListLabels
    readonly on: ExperienceListActions
    readonly source: string
    readonly isLoading: boolean
}

/** The first visit: what an item is, then the four ways in, each a row to the place that makes one. */
const FirstVisit = (props: ReadyProps) => (
    <Stack gap="region">
        <Alert tone="informative" title={props.labels.firstTitle} description={props.labels.firstText} />
        <Section
            kind="list"
            ariaLabel={props.labels.waysLabel}
            isLoading={props.isLoading}
            items={(props.view.ways ?? []).map((way): ListRowData => ({ ...way }))}
            empty={null}
        />
    </Stack>
)

/** The tab holds no item: what it means, and the way back to the whole list. */
const EmptyTab = (props: ReadyProps) => (
    <EmptyNotice
        message={props.labels.emptyTabTitle}
        description={props.labels.emptyTabText}
        actionLabel={props.labels.showAll}
        onAction={() => props.on.selectTab("all")}
        frame="frameless"
    />
)

/** The patterns fully Accepted that wait to become an experience, each with the command that claims it. */
const Claims = (props: ReadyProps) => (
    <Section
        kind="list"
        title={props.labels.claimsTitle}
        headingLevel={2}
        count={props.view.claims.length}
        isLoading={props.isLoading}
        items={props.view.claims.map((claim): ListRowData => ({
            id: claim.patternId,
            title: claim.title,
            description: claim.description,
            action: { label: props.labels.claimAction, press: () => props.on.claim(claim.patternId) },
        }))}
        empty={null}
    />
)

/** The list: the source chips, then the cards of the chosen tab and source, then the patterns ready to claim. */
const Items = (props: ReadyProps) => (
    <Stack gap="region">
        <Tabs
            kind="filter"
            label={props.labels.sourcesLabel}
            items={props.view.sources.map((source) => ({ id: source.id, label: source.label, count: source.count }))}
            selectedKey={props.source}
            onSelect={props.on.selectSource}
        />
        {props.view.cards.length === 0 ? (
            <EmptyTab {...props} />
        ) : (
            <Stack gap="row">
                {props.view.cards.map((card) => (
                    <ExperienceCard
                        key={card.itemId}
                        card={card}
                        labels={props.labels}
                        on={props.on}
                        isLoading={props.isLoading}
                    />
                ))}
            </Stack>
        )}
        {props.view.claims.length === 0 ? null : <Claims {...props} />}
    </Stack>
)

/**
 * Draws Experience the way the canvas does: the trail Hồ sơ / Kinh nghiệm, the event line, the state tabs with their counts, the source
 * chips, then the item cards. A returned card shows the teacher's note first; an AI-graded card opens the line in both languages and sends
 * it for review after a confirm (a sent line is locked); a verified card carries the profile switch and the copy command.
 */
export const ExperienceListBase = (props: ExperienceListBaseProps) => {
    const { labels, meta, tabs, confirmLine } = props.props
    return (
        <Page
            header={{
                breadcrumbs: {
                    label: labels.crumbLabel,
                    items: [
                        { id: "profile", label: labels.crumbProfile, href: labels.crumbHref },
                        { id: "experience", label: labels.title },
                    ],
                },
                title: labels.title,
                titleScale: "standard",
                ...(meta === undefined ? {} : { meta }),
                ...(tabs === undefined
                    ? {}
                    : {
                          tabs: {
                              label: labels.tabsLabel,
                              kind: "views" as const,
                              items: tabs,
                              selectedKey: props.props.tab,
                              onSelect: props.on.selectTab,
                          },
                      }),
            }}
        >
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => {
                    const ready = { view, labels, on: props.on, source: props.props.source, isLoading }
                    return view.ways === undefined ? <Items {...ready} /> : <FirstVisit {...ready} />
                }}
            />
            <AlertDialog
                title={labels.confirmTitle}
                description={`${labels.confirmText} "${confirmLine ?? ""}"`}
                tone="cautionary"
                confirmLabel={labels.confirmAction}
                cancelLabel={labels.confirmCancel}
                isOpen={props.props.isConfirmOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) props.on.cancelSend()
                }}
                onConfirm={props.on.confirmSend}
                onCancel={props.on.cancelSend}
            />
        </Page>
    )
}
