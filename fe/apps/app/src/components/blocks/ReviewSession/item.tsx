import {
    Alert,
    Badge,
    Button,
    ChoiceChips,
    Cluster,
    Heading,
    Kbd,
    Stack,
    SurfaceCard,
    Text,
    Textarea,
} from "@starci/grammar/common"
import { MarkdownBody } from "@starci-next/ui"
import type { ReviewBackView, ReviewItemScreen, ReviewSessionLabels } from "@/modules/types"

/** What the item the learner works on needs: the screen, the words, the handlers and whether it is a skeleton. */
export type ReviewItemCardProps = {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly isLoading: boolean
    readonly on: {
        readonly setNote: (text: string) => void
        readonly pick: (n: number, choice: string) => void
        readonly flip: () => void
        readonly submitAnswer: () => void
        readonly grade: (grade: ReviewBackView["grades"][number]["grade"]) => void
        readonly skip: () => void
        readonly retry: () => void
    }
}

/** What the cloze checks need. */
type ClozeProps = {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly onPick: (n: number, choice: string) => void
}

/** What the notices need. */
type NoticesProps = { readonly issue: ReviewItemScreen["issue"]; readonly labels: ReviewSessionLabels }

/** What the answer box needs. */
type RecallProps = {
    readonly item: ReviewItemScreen
    readonly labels: ReviewSessionLabels
    readonly on: Pick<ReviewItemCardProps["on"], "setNote" | "flip" | "submitAnswer" | "skip">
}

/** What the revealed answer needs. */
type BackProps = {
    readonly item: ReviewItemScreen
    readonly back: ReviewBackView
    readonly labels: ReviewSessionLabels
    readonly on: Pick<ReviewItemCardProps["on"], "grade" | "retry">
}

/** What the badges above the question need. */
type BadgesProps = { readonly item: ReviewItemScreen }

/** The cloze checks: pick the hidden term among the choices; the check answers at once and calls no AI. */
const Cloze = (props: ClozeProps) =>
    props.item.cloze.length === 0 ? null : (
        <Stack gap="row">
            <Text size="sm" tone="muted">
                {props.labels.clozeTitle}
            </Text>
            {props.item.cloze.map((each) => (
                <Stack key={each.n} gap="inline">
                    <ChoiceChips
                        label={each.label}
                        options={each.choices.map((choice) => ({ value: choice, label: choice }))}
                        {...(each.picked === undefined ? {} : { value: each.picked })}
                        onValueChange={(choice) => props.onPick(each.n, choice)}
                        empty={null}
                    />
                    {each.result === undefined ? null : (
                        <Badge tone={each.result === "correct" ? "success" : "warning"}>
                            {each.result === "correct" ? props.labels.clozeCorrect : props.labels.clozeWrong}
                        </Badge>
                    )}
                </Stack>
            ))}
        </Stack>
    )

/** The notices under the answer box: written grading is not available yet, or the call failed. */
const Notices = (props: NoticesProps) => (
    <>
        {props.issue === "soon" ? (
            <Alert tone="informative" title={props.labels.retrievalSoon} description={props.labels.retrievalSoonNote} />
        ) : null}
        {props.issue === "failed" ? (
            <Alert tone="negative" title={props.labels.saveFailedTitle} description={props.labels.saveFailedBody} />
        ) : null}
    </>
)

/** The answer box before the flip: a note for a card (not graded), the written answer for a retrieval question. */
const Recall = (props: RecallProps) => {
    const isRetrieval = props.item.isRetrieval
    const isSoon = props.item.issue === "soon"
    return (
        <Stack gap="row">
            <Textarea
                label={isRetrieval ? props.labels.retrievalLabel : props.labels.noteLabel}
                placeholder={isRetrieval ? props.labels.retrievalPlaceholder : props.labels.notePlaceholder}
                rows={4}
                value={props.item.note}
                isDisabled={props.item.isFlipping || isSoon}
                {...(props.item.issue === "invalid" ? { isInvalid: true, errorMessage: props.labels.answerError } : {})}
                onValueChange={props.on.setNote}
            />
            <Notices issue={props.item.issue} labels={props.labels} />
            <Cluster gap="inline" wrap align="center">
                {isSoon ? (
                    <Button intent="alternative" onPress={props.on.skip}>
                        {props.labels.skip}
                    </Button>
                ) : (
                    <Button
                        intent="commit"
                        isPending={props.item.isFlipping}
                        isDisabled={isRetrieval && props.item.note.trim() === ""}
                        onPress={isRetrieval ? props.on.submitAnswer : props.on.flip}
                    >
                        {isRetrieval ? props.labels.revealRetrieval : props.labels.flip}
                    </Button>
                )}
                {isRetrieval ? null : <Kbd keys={["space"]} />}
            </Cluster>
        </Stack>
    )
}

/** The revealed answer with its muted sections and the four grade buttons. */
const Back = (props: BackProps) => (
    <Stack gap="row">
        <SurfaceCard treatment="soft" ariaLabel={props.item.question}>
            <Stack gap="row">
                {props.back.parts.map((part) => (
                    <Stack key={part.id} gap="inline">
                        {part.title === undefined ? null : (
                            <Text size="sm" tone="muted" isStrong>
                                {part.title}
                            </Text>
                        )}
                        <MarkdownBody
                            blocks={part.blocks}
                            diagramLabel={props.labels.diagram}
                            diagramErrorTitle={props.labels.diagramError}
                        />
                    </Stack>
                ))}
            </Stack>
        </SurfaceCard>
        <Text size="sm" tone="muted">
            {props.labels.rateQuestion}
        </Text>
        <Cluster gap="inline" wrap label={props.labels.rateGroup}>
            {props.back.grades.map((each) => (
                <Button
                    key={each.grade}
                    intent={each.grade === "AGAIN" ? "neutral" : "alternative"}
                    isDisabled={props.item.isGrading}
                    onPress={() => props.on.grade(each.grade)}
                >
                    {`${each.key} · ${each.label} · ${each.interval}`}
                </Button>
            ))}
        </Cluster>
        {props.item.isGradeFailed ? (
            <Alert
                tone="negative"
                title={props.labels.saveFailedTitle}
                description={props.labels.saveFailedBody}
                action={{ label: props.labels.retry, onAction: props.on.retry }}
            />
        ) : null}
        <Text size="sm" tone="muted">
            {props.labels.shortcuts}
        </Text>
    </Stack>
)

/** The badges above the question: where it comes from, its level and tags. */
const Badges = (props: BadgesProps) => (
    <Cluster gap="inline" wrap>
        <Badge tone="muted">{props.item.sourceLine}</Badge>
        {props.item.level === undefined ? null : <Badge tone="accent">{props.item.level}</Badge>}
        {props.item.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
                {tag}
            </Badge>
        ))}
    </Cluster>
)

/** One item: where it comes from, the question, the cloze checks, the answer box, then the revealed answer and the grades. */
export const ReviewItemCard = (props: ReviewItemCardProps) => (
    <SurfaceCard ariaLabel={props.item.question} isLoading={props.isLoading}>
        <Stack gap="row">
            <Badges item={props.item} />
            {props.item.lessonLine === undefined ? null : (
                <Text size="sm" tone="muted">
                    {props.item.lessonLine}
                </Text>
            )}
            <Heading level={2} scale="standard">
                {props.item.question}
            </Heading>
            {props.item.back === undefined ? (
                <Stack gap="inline">
                    <Cloze item={props.item} labels={props.labels} onPick={props.on.pick} />
                    <Recall item={props.item} labels={props.labels} on={props.on} />
                </Stack>
            ) : (
                <Back item={props.item} labels={props.labels} on={props.on} back={props.item.back} />
            )}
        </Stack>
    </SurfaceCard>
)
