import {
    Alert,
    Badge,
    Button,
    ChoiceChips,
    Cluster,
    Grid,
    Heading,
    Link,
    NumberField,
    Page,
    Select,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type {
    DataSlot,
    ReviewDeckCard,
    ReviewDeckNote,
    ReviewDecksLabels,
    ReviewFilterOption,
    ReviewGoalForm,
    SlotLabels,
} from "@/modules/types"

/** The fake decks with the geometry of settled ones, drawn as a skeleton while the first read runs. */
export const REVIEW_DECKS_PLACEHOLDER: ReadonlyArray<ReviewDeckCard> = [1, 2, 3].map((index) => ({
    id: `placeholder-${index}`,
    title: "xxxxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxxxxxxxxxx",
    difficulty: "xxxxxx",
    cards: "xxxxxx",
    free: "xxxxxx",
    isPartlyLocked: false,
    isAdded: false,
    isPending: false,
}))

/** Props for {@link ReviewDecksBase}. */
export type ReviewDecksBaseProps = {
    readonly props: {
        readonly slot: DataSlot<ReadonlyArray<ReviewDeckCard>>
        readonly placeholder: ReadonlyArray<ReviewDeckCard>
        readonly slotLabels: SlotLabels
        readonly labels: ReviewDecksLabels
        readonly tracks: ReadonlyArray<ReviewFilterOption>
        readonly courses: ReadonlyArray<ReviewFilterOption>
        readonly track: string
        readonly course: string
        /** The note about the last add or remove; undefined shows none. */
        readonly note: ReviewDeckNote | undefined
        readonly goal: ReviewGoalForm
        readonly todayHref: string
    }
    readonly on: {
        readonly retry: () => void
        readonly setTrack: (track: string) => void
        readonly setCourse: (course: string) => void
        readonly toggle: (deckId: string) => void
        readonly setGoal: (value: number) => void
        readonly saveGoal: () => void
    }
}

/** The tone of a difficulty the teacher wrote. */
const toneOf = (difficulty: string): "success" | "warning" | "danger" | "neutral" => {
    switch (difficulty.toLowerCase()) {
        case "easy":
            return "success"
        case "medium":
            return "warning"
        case "hard":
            return "danger"
        default:
            return "neutral"
    }
}

/** The goal form: how many cards a day, from 5 to 50. */
const GoalForm = (props: Pick<ReviewDecksBaseProps, "props" | "on">) => (
    <SurfaceCard label={props.props.labels.goalTitle}>
        <Stack gap="row">
            <NumberField
                label={props.props.labels.goalLabel}
                description={props.props.labels.goalHelp}
                value={props.props.goal.value}
                minValue={props.props.goal.min}
                maxValue={props.props.goal.max}
                {...(props.props.goal.state === "invalid"
                    ? { isInvalid: true, errorMessage: props.props.labels.goalInvalid }
                    : {})}
                onValueChange={props.on.setGoal}
            />
            <Button intent="commit" isPending={props.props.goal.isSaving} onPress={props.on.saveGoal}>
                {props.props.labels.goalSave}
            </Button>
            {props.props.goal.state === "saved" ? <Badge tone="success">{props.props.labels.goalSaved}</Badge> : null}
            {props.props.goal.state === "failed" ? <Text tone="muted">{props.props.labels.failed}</Text> : null}
        </Stack>
    </SurfaceCard>
)

/** What one deck card needs. */
type DeckProps = {
    readonly deck: ReviewDeckCard
    readonly labels: ReviewDecksLabels
    readonly onToggle: (id: string) => void
}

/** One deck: title, difficulty, card counts, partly-locked mark and add or remove. */
const Deck = (props: DeckProps) => (
    <SurfaceCard ariaLabel={props.deck.title}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center" justify="between">
                <Heading level={3} scale="standard">
                    {props.deck.title}
                </Heading>
                <Badge tone={toneOf(props.deck.difficulty)}>{props.deck.difficulty}</Badge>
            </Cluster>
            <Text tone="muted" overflow="clamp-2">
                {props.deck.description}
            </Text>
            <Cluster gap="inline" wrap>
                <Badge tone="neutral">{props.deck.cards}</Badge>
                <Badge tone="muted">{props.deck.free}</Badge>
                {props.deck.isPartlyLocked ? <Badge tone="warning">{props.labels.partlyLocked}</Badge> : null}
            </Cluster>
            <Cluster gap="inline" wrap align="center">
                <Button
                    intent={props.deck.isAdded ? "alternative" : "commit"}
                    isPending={props.deck.isPending}
                    onPress={() => props.onToggle(props.deck.id)}
                >
                    {props.deck.isAdded ? props.labels.remove : props.labels.add}
                </Button>
                {props.deck.isAdded ? <Badge tone="success">{props.labels.added}</Badge> : null}
            </Cluster>
        </Stack>
    </SurfaceCard>
)

/** The aside: filters by path and by course, and the way back to today's review. */
const Rail = (props: ReviewDecksBaseProps) => (
    <Stack gap="region">
        <SurfaceCard label={props.props.labels.asideTitle}>
            <Stack gap="row">
                <ChoiceChips
                    label={props.props.labels.filterLabel}
                    options={props.props.tracks.map((each) => ({ value: each.id, label: each.label }))}
                    value={props.props.track}
                    onValueChange={props.on.setTrack}
                    empty={null}
                />
                <Select
                    label={props.props.labels.courseLabel}
                    options={props.props.courses}
                    value={props.props.course}
                    onValueChange={(course) => props.on.setCourse(course ?? "all")}
                />
            </Stack>
        </SurfaceCard>
        <Link variant="plain" href={props.props.todayHref}>
            {props.props.labels.back}
        </Link>
    </Stack>
)

/** The well: the note about the last change, the deck cards and the goal form. */
const Primary = (props: ReviewDecksBaseProps) => (
    <Stack gap="region">
        {props.props.note === undefined ? null : <Alert tone={props.props.note.tone} title={props.props.note.text} />}
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(decks) => (
                <Stack gap="row">
                    {decks.map((deck) => (
                        <Deck key={deck.id} deck={deck} labels={props.props.labels} onToggle={props.on.toggle} />
                    ))}
                </Stack>
            )}
        />
        <GoalForm props={props.props} on={props.on} />
    </Stack>
)

/** The decks screen: filters in the aside, deck cards in the well, and the daily goal form. */
export const ReviewDecksBase = (props: ReviewDecksBaseProps) => (
    <Page
        header={{
            title: props.props.labels.pageTitle,
            titleScale: "standard",
            description: props.props.labels.intro,
            breadcrumbs: {
                label: props.props.labels.back,
                items: [
                    { id: "review", label: props.props.labels.back, href: props.props.todayHref },
                    { id: "decks", label: props.props.labels.pageTitle },
                ],
            },
        }}
    >
        <Grid
            kind="main-rail"
            railPosition="leading"
            railWidth="standard"
            primary={<Primary {...props} />}
            rail={<Rail {...props} />}
        />
    </Page>
)
