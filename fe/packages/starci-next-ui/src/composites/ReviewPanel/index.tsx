import {
    Alert,
    Badge,
    Cluster,
    EmptyNotice,
    Section,
    Stack,
    SurfaceCard,
    Text,
    type BadgeTone,
} from "@starci/grammar/common"
import {
    ReviewDecisionCard,
    type ReviewDecisionLabels,
    type ReviewPanelActions,
    type ReviewPanelDecision,
} from "../ReviewDecisionCard"

/** One graded criterion of an item under review. */
export type ReviewCriterionView = {
    readonly id: string
    readonly criterion: string
    readonly level: string
    readonly tone: BadgeTone
}
/** One piece of evidence of an item under review: its label, and a reference under it only where a reader should see one. */
export type ReviewEvidenceView = { readonly id: string; readonly label: string; readonly ref?: string }
/** One row of an item's audit trail, in words. */
export type ReviewHistoryView = { readonly id: string; readonly text: string; readonly note: string | undefined }
/** The item a signer decides, every word resolved. */
export type ReviewPreviewView = {
    readonly itemId: string
    readonly part: string
    readonly who: string
    readonly state: string
    readonly stateTone: BadgeTone
    readonly line: string
    readonly lineEn: string
    readonly due: string | undefined
    readonly evidence: ReadonlyArray<ReviewEvidenceView>
    readonly criteria: ReadonlyArray<ReviewCriterionView>
    readonly defense: ReadonlyArray<string>
    /** The item waits for a decision: Verify and Return with a note are offered. */
    readonly isOpen: boolean
    /** The teacher may revoke it: it is verified. */
    readonly canRevoke: boolean
    readonly history: ReadonlyArray<ReviewHistoryView>
}
/** The fixed words of the review panel. */
export type ReviewPanelLabels = ReviewDecisionLabels & {
    readonly previewEmpty: string
    readonly aiLine: string
    readonly evidenceTitle: string
    readonly gradeTitle: string
    readonly defenseTitle: string
    readonly historyTitle: string
}

/** Props for {@link ReviewPanel}. */
type ReviewPanelProps = {
    readonly item: ReviewPreviewView | undefined
    readonly labels: ReviewPanelLabels
    readonly decision: ReviewPanelDecision
    readonly on: ReviewPanelActions
}

/** What a part of the panel draws: one item and the words. */
type ReviewPartProps = { readonly item: ReviewPreviewView; readonly labels: ReviewPanelLabels }

/** What the item card draws: the item, the words, the decision state and the commands. */
type ReviewCardProps = {
    readonly item: ReviewPreviewView
    readonly labels: ReviewPanelLabels
    readonly decision: ReviewPanelDecision
    readonly on: ReviewPanelActions
}

/** The evidence, the AI grade and the defense questions of an item, each a list under its own title. */
const ReviewFacts = (props: ReviewPartProps) => (
    <>
        {props.item.evidence.length === 0 ? null : (
            <Section
                kind="list"
                title={props.labels.evidenceTitle}
                headingLevel={2}
                count={props.item.evidence.length}
                items={props.item.evidence.map((evidence) => ({
                    id: evidence.id,
                    title: evidence.label,
                    ...(evidence.ref === undefined ? {} : { meta: { text: evidence.ref } }),
                }))}
                empty={null}
            />
        )}
        {props.item.criteria.length === 0 ? null : (
            <Section
                kind="list"
                title={props.labels.gradeTitle}
                headingLevel={2}
                count={props.item.criteria.length}
                items={props.item.criteria.map((criterion) => ({
                    id: criterion.id,
                    title: criterion.criterion,
                    badges: [{ label: criterion.level, tone: criterion.tone }],
                }))}
                empty={null}
            />
        )}
        {props.item.defense.length === 0 ? null : (
            <Section
                kind="list"
                title={props.labels.defenseTitle}
                headingLevel={2}
                count={props.item.defense.length}
                items={props.item.defense.map((question) => ({ id: question, title: question }))}
                empty={null}
            />
        )}
    </>
)

/** The audit trail of an item, oldest first. */
const ReviewHistory = (props: ReviewPartProps) => (
    <Section
        kind="list"
        title={props.labels.historyTitle}
        headingLevel={2}
        count={props.item.history.length}
        items={props.item.history.map((row) => ({
            id: row.id,
            title: row.text,
            ...(row.note === undefined ? {} : { description: row.note }),
        }))}
        empty={null}
    />
)

/** The item a signer decides: part, learner, state, the line in both locales, its facts, the decision and its history. */
const ReviewItemCard = (props: ReviewCardProps) => (
    <Stack gap="region">
        <SurfaceCard ariaLabel={props.item.part}>
            <Stack gap="row">
                <Cluster gap="inline" wrap justify="between" align="center">
                    <Cluster gap="identity" align="center">
                        <Badge tone="neutral">{props.item.part}</Badge>
                        <Text role="caption">{props.item.who}</Text>
                    </Cluster>
                    <Badge tone={props.item.stateTone} isDot>
                        {props.item.state}
                    </Badge>
                </Cluster>
                <Text role="caption">{props.labels.aiLine}</Text>
                <Text as="p">{props.item.line}</Text>
                <Text as="p" tone="muted">
                    {props.item.lineEn}
                </Text>
                {props.item.due === undefined ? null : <Text tone="muted">{props.item.due}</Text>}
            </Stack>
        </SurfaceCard>
        <ReviewFacts item={props.item} labels={props.labels} />
        <ReviewDecisionCard
            isOpen={props.item.isOpen}
            canRevoke={props.item.canRevoke}
            labels={props.labels}
            decision={props.decision}
            on={props.on}
        />
        {props.decision.outcome === undefined ? null : (
            <Alert tone={props.decision.outcome.tone} title={props.decision.outcome.text} />
        )}
        {props.item.history.length === 0 ? null : <ReviewHistory item={props.item} labels={props.labels} />}
    </Stack>
)

/**
 * The review panel of one experience item (Program screen queue, its right pane, and /review-queue/{itemId}): the line the AI
 * drafted, the evidence, the AI grade and the defense questions, then Verify and Return with a note, or Revoke for the teacher on a
 * verified item, and the history. With no item it says how to pick one.
 */
export const ReviewPanel = (props: ReviewPanelProps) =>
    props.item === undefined ? (
        <EmptyNotice message={props.labels.previewEmpty} />
    ) : (
        <ReviewItemCard item={props.item} labels={props.labels} decision={props.decision} on={props.on} />
    )
