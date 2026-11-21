import { Alert, Section, Stack, SurfaceCard, Text, Timeline } from "@starci/grammar/common"
import { withInlineCode } from "./inline"
import type { EssenceInsight, EssenceLabels, EssenceQuestionView, EssenceView } from "./types"

/** What the story card needs. */
export type LessonStoryCardProps = {
    readonly view: EssenceView
    readonly labels: EssenceLabels
}

/**
 * The situation the opener tells, above the questions: its title and body, then the timeline of the developments so far, one per
 * question up to the one on screen, which is the current entry. Nothing for a lesson written before the story.
 */
export const LessonStoryCard = (props: LessonStoryCardProps) => {
    const { story, timeline } = props.view
    if (story === undefined) return null
    return (
        <SurfaceCard label={story.title}>
            <Stack gap="section">
                <Text as="p">{withInlineCode(story.body)}</Text>
                {timeline.length === 0 ? null : (
                    <Timeline
                        label={props.labels.opener.timeline}
                        items={timeline.map((event) => ({
                            id: event.id,
                            title: withInlineCode(event.text),
                            timeLabel: event.at,
                            isCurrent: event.isCurrent,
                        }))}
                    />
                )}
            </Stack>
        </SurfaceCard>
    )
}

/** What one story question needs. */
export type LessonStoryQuestionProps = {
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels
    /** True for the last question: the panel of the right pick leads to the result. */
    readonly isLast: boolean
    /** Picks an option and sends it to be graded on the spot. */
    readonly onAnswer: (activityId: string, optionId: string) => void
    /** Moves to the next development of the story (or to the result after the last question). */
    readonly onNext: () => void
}

/** One option row: a wrong pick is locked with why it is wrong under it, the right pick is marked, the others can be picked. */
const rowOf = (
    props: LessonStoryQuestionProps,
    choice: EssenceQuestionView["choices"][number],
    position: number,
    isBusy: boolean,
) => {
    const { question, labels } = props
    const base = { id: choice.id, title: choice.label.replaceAll("`", ""), leading: { position: position + 1 } }
    const miss = question.misses.find((each) => each.optionId === choice.id)
    if (miss !== undefined)
        return {
            ...base,
            verdict: "danger" as const,
            badges: [{ label: labels.opener.wrongMark, tone: "danger" as const }] as const,
            detail: (
                <Alert
                    tone="negative"
                    title={labels.opener.wrongTitle}
                    description={withInlineCode(miss.explanation)}
                />
            ),
        }
    if (question.isSolved && choice.id === question.pickedId)
        return {
            ...base,
            verdict: "success" as const,
            badges: [{ label: labels.opener.rightMark, tone: "success" as const }] as const,
        }
    if (question.isSolved || isBusy) return base
    return { ...base, onPress: () => props.onAnswer(question.id, choice.id) }
}

/** One part of the insight: its name, then its words. */
const InsightPart = (props: { readonly title: string; readonly text: string }) => (
    <Stack gap="identity">
        <Text as="p" isStrong>
            {props.title}
        </Text>
        <Text as="p">{withInlineCode(props.text)}</Text>
    </Stack>
)

/** The three parts of the insight, or the right option's own explanation when the question has none. */
const insightOf = (insight: EssenceInsight | undefined, explanation: string, labels: EssenceLabels["opener"]) =>
    insight === undefined ? (
        <Text as="p">{withInlineCode(explanation)}</Text>
    ) : (
        <Stack gap="inline">
            <InsightPart title={labels.essence} text={insight.essence} />
            <InsightPart title={labels.need} text={insight.why} />
            <InsightPart title={labels.interview} text={insight.interview} />
        </Stack>
    )

/**
 * One question of the story opener, graded the moment an option is picked. A wrong pick is locked with why it is wrong under it and
 * the learner picks again; the right pick opens the success panel (Bản chất, Vì sao cần, Trả lời phỏng vấn) with the command to the
 * next development of the story.
 */
export const LessonStoryQuestion = (props: LessonStoryQuestionProps) => {
    const { question, labels } = props
    const isBusy = question.status === "pending" || question.status === "grading"
    return (
        <Stack gap="section">
            <Text as="p" isStrong>
                {withInlineCode(question.prompt)}
            </Text>
            <Section
                kind="list"
                ariaLabel={question.prompt}
                empty={labels.opener.empty}
                items={question.choices.map((choice, position) => rowOf(props, choice, position, isBusy))}
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
            {isBusy ? <Alert tone="informative" title={labels.opener.grading} /> : null}
            {question.isSolved ? (
                <Alert
                    tone="affirmative"
                    title={labels.opener.rightTitle}
                    form={insightOf(question.insight, question.explanation, labels.opener)}
                    action={{ label: props.isLast ? labels.opener.finish : labels.opener.next, onAction: props.onNext }}
                />
            ) : (
                <Text tone="muted">{question.misses.length === 0 ? labels.opener.hint : labels.opener.again}</Text>
            )}
        </Stack>
    )
}
