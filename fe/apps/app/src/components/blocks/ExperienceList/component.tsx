import {
    Alert,
    Badge,
    Button,
    Cluster,
    Grid,
    Link,
    Page,
    Stack,
    SurfaceCard,
    Text,
    Textarea,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, ExperienceCardView, ExperienceListView, SlotLabels } from "@/modules/types"

/** The fake list with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const EXPERIENCE_PLACEHOLDER: ExperienceListView = {
    facts: ["xxxxxx"],
    flow: ["xxxxxx", "xxxxxx", "xxxxxx", "xxxxxx"],
    tabs: [{ id: "all", label: "xxxxxx", count: 0 }],
    cards: [1, 2].map((index) => ({
        itemId: `placeholder-${index}`,
        part: "xxxxxx",
        state: "xxxxxx",
        stateTone: "neutral" as const,
        lineCaption: "xxxxxx",
        line: "xxxxxxxxxxxxxxxxxxxxxxxx",
        evidence: [{ id: "e", label: "xxxxxx" }],
        returnNote: undefined,
        meta: "xxxxxx",
        edit: undefined,
        verified: undefined,
        notice: undefined,
        isBusy: false,
    })),
}

/** The fixed words of the page. */
export type ExperienceListLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    readonly flowLabel: string
    readonly tabsLabel: string
    readonly emptyTab: string
    readonly returnedNote: string
    readonly sendHint: string
    readonly editVi: string
    readonly editEn: string
    readonly verifyLink: string
}

/** What the reader does on the list. */
export type ExperienceListActions = {
    readonly retry: () => void
    readonly selectTab: (tab: string) => void
    readonly editLine: (itemId: string, locale: "vi" | "en", text: string) => void
    readonly send: (itemId: string) => void
    readonly toggleShown: (itemId: string) => void
}

/** What one card is drawn from: the card, the fixed words and the actions. */
type ExperienceCardProps = {
    readonly card: ExperienceCardView
    readonly labels: ExperienceListLabels
    readonly on: ExperienceListActions
}

/** What the intro is drawn from. */
type ExperienceIntroProps = { readonly view: ExperienceListView; readonly labels: ExperienceListLabels }

/** Props for {@link ExperienceListBase}. */
export type ExperienceListBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ExperienceListView>
        readonly placeholder: ExperienceListView
        readonly slotLabels: SlotLabels
        readonly labels: ExperienceListLabels
        readonly tab: string
    }
    readonly on: ExperienceListActions
}

/** The editor of a sendable item: both lines, the rule that figures stay, and Send for review. */
const CardEdit = (props: ExperienceCardProps) => {
    const { card, labels, on } = props
    if (card.edit === undefined) return null
    return (
        <Stack gap="row">
            <Textarea
                label={labels.editVi}
                value={card.edit.vi}
                rows={3}
                onValueChange={(text) => on.editLine(card.itemId, "vi", text)}
            />
            <Textarea
                label={labels.editEn}
                value={card.edit.en}
                rows={3}
                onValueChange={(text) => on.editLine(card.itemId, "en", text)}
            />
            <Cluster gap="inline" wrap align="center">
                <Button intent="commit" isPending={card.isBusy} onPress={() => on.send(card.itemId)}>
                    {card.edit.sendLabel}
                </Button>
                <Text size="sm" tone="muted">
                    {labels.sendHint}
                </Text>
            </Cluster>
        </Stack>
    )
}

/** One item: part and state, the returned note first, the line, the evidence chips, the meta line and the next action. */
const ExperienceCard = (props: ExperienceCardProps) => {
    const { card, labels, on } = props
    return (
        <SurfaceCard label={card.part} height="fill">
            <Stack gap="row">
                <Cluster gap="inline" wrap justify="between">
                    <Badge tone="neutral">{card.part}</Badge>
                    <Badge tone={card.stateTone} isDot>
                        {card.state}
                    </Badge>
                </Cluster>
                {card.returnNote === undefined ? null : (
                    <Alert tone="cautionary" title={labels.returnedNote} description={card.returnNote} />
                )}
                <Stack gap="identity">
                    <Text size="sm" tone="muted">
                        {card.lineCaption}
                    </Text>
                    <Text as="p">{card.line}</Text>
                </Stack>
                <Cluster gap="inline" wrap>
                    {card.evidence.map((chip) => (
                        <Badge key={chip.id} tone="accent">
                            {chip.label}
                        </Badge>
                    ))}
                </Cluster>
                <Text size="sm" tone="muted">
                    {card.meta}
                </Text>
                <CardEdit card={card} labels={labels} on={on} />
                {card.verified === undefined ? null : (
                    <Cluster gap="inline" wrap align="center" justify="between">
                        <Link
                            variant="plain"
                            href={card.verified.href}
                        >{`${labels.verifyLink}: ${card.verified.code}`}</Link>
                        <Button
                            intent="alternative"
                            size="sm"
                            isPending={card.isBusy}
                            onPress={() => on.toggleShown(card.itemId)}
                        >
                            {card.verified.toggleLabel}
                        </Button>
                    </Cluster>
                )}
                {card.notice === undefined ? null : <Alert tone="negative" title={card.notice} />}
            </Stack>
        </SurfaceCard>
    )
}

/** The state tabs for the page header: the settled ones once the read is ready, the placeholder's while it runs. */
const tabsOf = (base: ExperienceListBaseProps["props"]) =>
    ("items" in base.slot ? base.slot.items : base.placeholder).tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tab.count,
    }))

/** The intro: what an item is, the four steps and the counts. */
const ExperienceIntro = (props: ExperienceIntroProps) => (
    <SurfaceCard ariaLabel={props.labels.title}>
        <Stack gap="row">
            <Cluster gap="inline" wrap label={props.labels.flowLabel}>
                {props.view.flow.map((step) => (
                    <Badge key={step} tone="neutral">
                        {step}
                    </Badge>
                ))}
            </Cluster>
            <Cluster gap="inline" wrap>
                {props.view.facts.map((fact) => (
                    <Text key={fact} size="sm" tone="muted">
                        {fact}
                    </Text>
                ))}
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/**
 * Draws Experience the way the canvas does (Program screen experience): the intro with the four steps, the state tabs with their
 * counts, then the item cards. A returned card shows the teacher's note first; an ai-graded card offers Send for review with the
 * line editable in words but not in figures; a verified card links to its verification page.
 */
export const ExperienceListBase = (props: ExperienceListBaseProps) => (
    <Page
        header={{
            breadcrumbs: "root",
            title: props.props.labels.title,
            titleScale: "title",
            description: props.props.labels.description,
            meta: props.props.labels.eyebrow,
            tabs: {
                label: props.props.labels.tabsLabel,
                kind: "views",
                items: tabsOf(props.props),
                selectedKey: props.props.tab,
                onSelect: props.on.selectTab,
            },
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view) => (
                <Stack gap="region">
                    <ExperienceIntro view={view} labels={props.props.labels} />
                    {view.cards.length === 0 ? (
                        <Text tone="muted">{props.props.labels.emptyTab}</Text>
                    ) : (
                        <Grid kind="cards" columns={2}>
                            {view.cards.map((card) => (
                                <ExperienceCard
                                    key={card.itemId}
                                    card={card}
                                    labels={props.props.labels}
                                    on={props.on}
                                />
                            ))}
                        </Grid>
                    )}
                </Stack>
            )}
        />
    </Page>
)
