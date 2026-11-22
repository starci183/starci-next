import {
    Alert,
    Button,
    DescriptionList,
    Disclosure,
    InlineStatus,
    ProportionBar,
    Section,
    Skeleton,
    Stack,
    Text,
} from "@starci/grammar/common"
import { withInlineCode } from "./inline"
import type { EssenceBarPart, EssenceInsight, EssenceLabels, EssenceQuestionView, EssenceView } from "./types"

/** The five questions as one bar: a segment per question coloured by how it went, the time of each under it. */
export const AnswerBar = (props: {
    readonly label: string
    readonly bar: ReadonlyArray<EssenceBarPart>
    readonly isLoading: boolean
}) => (
    <ProportionBar
        label={props.label}
        parts={props.bar.map((part) => ({
            id: part.id,
            label: part.label,
            value: 1,
            valueLabel: "",
            tone: part.tone,
        }))}
        empty={null}
        isLoading={props.isLoading}
    />
)

/** What the opener needs. */
export type LessonOpenerProps = {
    readonly view: EssenceView
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
    /** True for the last question: the command of the right pick leads to the result. */
    readonly isLast: boolean
    /** Picks an option and sends it to be graded on the spot. */
    readonly onAnswer: (activityId: string, optionId: string) => void
    /** Moves to the next question (or to the result after the last one). */
    readonly onNext: () => void
}

/** The row of one option: open to pick, crossed and locked with its one reason after a wrong pick, ticked after the right one. */
const rowOf = (props: LessonOpenerProps, choice: EssenceQuestionView["choices"][number], isBusy: boolean) => {
    const { question, labels } = props
    const title = choice.label.replaceAll("`", "")
    const reason = question.reasons.find((each) => each.optionId === choice.id)
    const miss = question.misses.find((each) => each.optionId === choice.id)
    const text = reason?.explanation ?? miss?.explanation ?? ""
    const description =
        text === ""
            ? {}
            : {
                  detail: (
                      <Text as="p" tone="muted">
                          {withInlineCode(text)}
                      </Text>
                  ),
              }
    if (question.isSolved) {
        const isRight = choice.id === question.correctId || choice.id === question.pickedId
        return {
            id: choice.id,
            title,
            ...description,
            value: (
                <InlineStatus
                    state={isRight ? "done" : "error"}
                    label={isRight ? labels.opener.rightMark : labels.opener.wrongMark}
                />
            ),
        }
    }
    if (miss !== undefined)
        return {
            id: choice.id,
            title,
            ...description,
            value: <InlineStatus state="error" label={labels.opener.wrongMark} />,
        }
    return isBusy
        ? { id: choice.id, title }
        : { id: choice.id, title, onPress: () => props.onAnswer(question.id, choice.id) }
}

/** The lines a right pick opens with: the essence, the model interview answer, and the longer story behind a disclosure. */
const InsightBlock = (props: { readonly insight: EssenceInsight; readonly labels: EssenceLabels["opener"] }) => (
    <Stack gap="inline">
        <DescriptionList
            items={[
                { id: "essence", term: props.labels.essence, description: withInlineCode(props.insight.essence) },
                {
                    id: "interview",
                    term: props.labels.interview,
                    description: withInlineCode(props.insight.interview),
                },
            ]}
        />
        {props.insight.why === "" ? null : (
            <Disclosure
                kind="quiet"
                title={props.labels.more}
                body={<Text as="p">{withInlineCode(props.insight.why)}</Text>}
            />
        )}
    </Stack>
)

/**
 * Mở đầu, one question at a time: the situation the five share, the bar of the five (a segment per question, the time under it), the
 * question with its four options. A wrong pick is crossed and locked with its one reason and the learner picks again; the right pick is
 * ticked, every option shows its reason, and the essence and the interview answer come with the command to the next question.
 */
export const LessonOpener = (props: LessonOpenerProps) => {
    const { view, question, labels, isLoading } = props
    const isBusy = question.status === "pending" || question.status === "grading"
    return (
        <Stack gap="region">
            <Stack gap="section">
                {view.story === undefined ? null : isLoading ? (
                    <Skeleton shape="text" />
                ) : (
                    <Text as="p">
                        <Text as="span" role="label.item">
                            {`${view.story.title}. `}
                        </Text>
                        {withInlineCode(view.story.body)}
                    </Text>
                )}
                <AnswerBar label={labels.opener.barLabel} bar={view.bar} isLoading={isLoading} />
            </Stack>
            <Stack gap="section">
                <Stack gap="identity">
                    <Text tone="muted" isLoading={isLoading}>
                        {view.caption}
                    </Text>
                    {question.event === undefined ? null : (
                        <Text as="p" isLoading={isLoading}>
                            {withInlineCode(question.event.text)}
                        </Text>
                    )}
                    <Text as="p" role="label.item" isLoading={isLoading}>
                        {withInlineCode(question.prompt)}
                    </Text>
                </Stack>
                <Section
                    kind="list"
                    ariaLabel={question.prompt}
                    empty={labels.opener.empty}
                    isLoading={isLoading}
                    items={question.choices.map((choice) => rowOf(props, choice, isBusy))}
                />
                {question.isSendFailed ? (
                    <Alert
                        tone="negative"
                        title={labels.opener.sendFailed}
                        action={{
                            label: labels.opener.retry,
                            onAction: () => props.onAnswer(question.id, question.pickedId),
                        }}
                    />
                ) : null}
                {isBusy ? <InlineStatus state="running" label={labels.opener.grading} /> : null}
                {question.isSolved ? (
                    <Stack gap="section">
                        {question.insight === undefined ? (
                            <Text as="p">{withInlineCode(question.explanation)}</Text>
                        ) : (
                            <InsightBlock insight={question.insight} labels={labels.opener} />
                        )}
                        <Button variant="primary" onPress={props.onNext}>
                            {props.isLast ? labels.opener.finish : labels.opener.next}
                        </Button>
                    </Stack>
                ) : (
                    <Text tone="muted" isLoading={isLoading}>
                        {question.misses.length === 0 ? labels.opener.hint : labels.opener.again}
                    </Text>
                )}
            </Stack>
        </Stack>
    )
}
