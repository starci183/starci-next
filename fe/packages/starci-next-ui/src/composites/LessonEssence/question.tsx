import { Alert, Cluster, Link, RadioGroup, Section, Stack, Stepper, Text } from "@starci/grammar/common"
import { withInlineCode } from "./inline"
import type { EssenceBarPart, EssenceLabels, EssenceQuestionView, EssenceView } from "./types"

/** What the answer bar needs. */
type AnswerBarProps = {
    readonly label: string
    readonly bar: ReadonlyArray<EssenceBarPart>
    readonly isLoading: boolean
}

/** The five answers as one segmented bar: a segment per question, filled and green-red by answer; the caption names the question on screen. */
export const AnswerBar = (props: AnswerBarProps) => (
    <Stepper
        kind="bar"
        label={props.label}
        steps={props.bar.map((part) => ({ id: part.id, label: part.label, state: part.state }))}
        currentStepId={props.bar.find((part) => part.isCurrent)?.id ?? ""}
        isLoading={props.isLoading}
    />
)

/** What the head of the opener needs. */
export type LessonOpenerHeadProps = {
    readonly view: EssenceView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
}

/** The eyebrow of the opener and the five-answer bar with the position line under it. */
export const LessonOpenerHead = (props: LessonOpenerHeadProps) => (
    <Stack gap="inline">
        <Text tone="muted">{props.labels.opener.eyebrow}</Text>
        <AnswerBar label={props.labels.opener.barLabel} bar={props.view.bar} isLoading={props.isLoading} />
    </Stack>
)

/** What one question needs. */
export type LessonQuestionProps = {
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
    /** Picks an option and sends it to be graded on the spot. */
    readonly onAnswer: (activityId: string, optionId: string) => void
}

/** The mark a row of a graded question carries: the right answer, or the pick that was wrong. */
const markOf = (question: EssenceQuestionView, optionId: string, labels: EssenceLabels["opener"]) => {
    if (optionId === question.correctId) return { verdict: "success" as const, meta: { text: labels.correct } }
    if (optionId === question.pickedId) return { verdict: "danger" as const, meta: { text: labels.picked } }
    return {}
}

/** What the explanation needs. */
type WhyProps = { readonly question: EssenceQuestionView; readonly labels: EssenceLabels["opener"] }

/** The explanation the grade released, with the section to read closely and the scenario that shows the answer. */
const Why = (props: WhyProps) =>
    props.question.explanation === "" ? null : (
        <Stack gap="inline">
            <Text>
                <Text as="span" isStrong>
                    {props.labels.why}
                </Text>{" "}
                {withInlineCode(props.question.explanation)}
            </Text>
            {props.question.isCorrect || props.question.links.length === 0 ? null : (
                <Cluster gap="identity" label={props.labels.readMore}>
                    {props.question.links.map((link) => (
                        <Link key={link.id} href={link.href}>
                            {link.label}
                        </Link>
                    ))}
                </Cluster>
            )}
        </Stack>
    )

/**
 * One multiple-choice interview question graded the moment an option is picked: before the grade the options are a radio group of
 * rows; after it they are rows that say which was right and which pick was wrong, then "Why" with the links. No free text.
 */
export const LessonQuestion = (props: LessonQuestionProps) => {
    const { question, labels } = props
    const isGraded = question.status === "graded"
    const isBusy = question.status === "pending" || question.status === "grading"
    return (
        <Stack gap="section">
            <Text as="p" isStrong>
                {withInlineCode(question.prompt)}
            </Text>
            {isGraded ? (
                <Section
                    kind="list"
                    ariaLabel={question.prompt}
                    empty={labels.opener.empty}
                    items={question.choices.map((choice, position) => ({
                        id: choice.id,
                        title: choice.label.replaceAll("`", ""),
                        leading: { position: position + 1 },
                        ...markOf(question, choice.id, labels.opener),
                    }))}
                />
            ) : (
                <RadioGroup
                    label={question.prompt}
                    isLabelHidden
                    appearance="rows"
                    options={question.choices.map((choice) => ({
                        value: choice.id,
                        label: withInlineCode(choice.label),
                        isDisabled: isBusy,
                    }))}
                    value={question.pickedId === "" ? null : question.pickedId}
                    onValueChange={(optionId) => props.onAnswer(question.id, optionId)}
                    isLoading={props.isLoading}
                />
            )}
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
            {isGraded ? (
                <Why question={question} labels={labels.opener} />
            ) : (
                <Text tone="muted">{labels.opener.hint}</Text>
            )}
        </Stack>
    )
}
