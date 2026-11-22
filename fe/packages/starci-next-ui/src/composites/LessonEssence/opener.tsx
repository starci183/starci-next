import {
    Alert,
    Badge,
    Button,
    Cluster,
    Disclosure,
    Divider,
    FencedCodeBlock,
    InlineStatus,
    Link,
    MermaidDiagram,
    Popover,
    Quote,
    Stack,
    Stepper,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { HighlightedCode } from "../../branches/HighlightedCode"
import { withInlineCode } from "./inline"
import { canMoveOn, isGrading, optionCardsOf, timelineStateOf, type OptionCard } from "./state"
import type { EssenceCode, EssenceInsight, EssenceLabels, EssenceQuestionView, EssenceView } from "./types"

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

/** A labelled passage of a card: its small label, then its words or its figure. */
const Passage = (props: { readonly label: string; readonly children: ReactNode; readonly isLoading?: boolean }) => (
    <Stack gap="identity">
        <Text role="label.group" isLoading={props.isLoading === true}>
            {props.label}
        </Text>
        {props.children}
    </Stack>
)

/**
 * Ngữ cảnh: the business the story happens in (its line and three key figures), the timeline of its five moments with the one on screen
 * current, what is happening now and its result, and the system the question touches (its flowchart) folded under "Bối cảnh", open on
 * the first question only.
 */
const ContextCard = (props: {
    readonly view: EssenceView
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels["opener"]
    readonly isLoading: boolean
}) => {
    const { view, question, labels, isLoading } = props
    const story = view.story
    const current = view.bar.find((part) => part.isCurrent)
    return (
        <SurfaceCard ariaLabel={labels.scenario} isLoading={isLoading}>
            <Stack gap="section">
                <Stack gap="identity">
                    <Text role="label.group" isLoading={isLoading}>
                        {story === undefined ? labels.scenario : `${labels.scenario} · ${story.title}`}
                    </Text>
                    {story === undefined || story.company === "" ? null : (
                        <Text tone="muted" isLoading={isLoading}>
                            {story.company}
                        </Text>
                    )}
                    {story === undefined || story.facts.length === 0 ? null : (
                        <Cluster gap="inline" label={labels.scenario}>
                            {story.facts.map((fact) => (
                                <Badge key={fact} tone="neutral" isLoading={isLoading}>
                                    {fact}
                                </Badge>
                            ))}
                        </Cluster>
                    )}
                </Stack>
                <Stepper
                    label={labels.barLabel}
                    currentStepId={current?.id ?? ""}
                    isLoading={isLoading}
                    steps={view.bar.map((part) => ({ id: part.id, label: part.label, state: timelineStateOf(part) }))}
                />
                {question.event === undefined ? null : (
                    <Passage label={labels.now} isLoading={isLoading}>
                        <Text as="p" isLoading={isLoading}>
                            {withInlineCode(question.event.text)}
                        </Text>
                    </Passage>
                )}
                {question.symptom === "" ? null : (
                    <Passage label={labels.symptom} isLoading={isLoading}>
                        <Text as="p" isLoading={isLoading}>
                            {withInlineCode(question.symptom)}
                        </Text>
                    </Passage>
                )}
                {question.contextDiagram === "" ? null : (
                    <Disclosure
                        key={question.id}
                        kind="quiet"
                        title={labels.system}
                        defaultExpanded={view.index === 0}
                        body={
                            <MermaidDiagram
                                source={question.contextDiagram}
                                label={labels.system}
                                errorTitle={labels.diagramError}
                                isLoading={isLoading}
                            />
                        }
                    />
                )}
            </Stack>
        </SurfaceCard>
    )
}

/** The mark an option card carries once it is graded: wrong for a locked pick, right for the solving one. */
const markOf = (card: OptionCard, labels: EssenceLabels["opener"]) => {
    if (card.state === "wrong") return <InlineStatus state="error" label={labels.wrongMark} />
    if (card.state === "right") return <InlineStatus state="done" label={labels.rightMark} />
    return null
}

/**
 * One option as a large pressable card keyed by its letter: open to pick; a wrong pick turns its edge danger, locks it and puts its
 * reason right under its words; the right pick turns success with its reason. Once solved, the options never picked show their reason.
 */
const OptionCardView = (props: {
    readonly card: OptionCard
    readonly labels: EssenceLabels["opener"]
    readonly isLoading: boolean
    readonly onPick: () => void
}) => {
    const { card, labels } = props
    const tone = card.state === "wrong" ? "danger" : card.state === "right" ? "success" : undefined
    const label = card.label.replaceAll("`", "")
    return (
        <SurfaceCard
            ariaLabel={`${card.key}. ${label}`}
            isLoading={props.isLoading}
            {...(tone === undefined ? {} : { tone })}
            {...(card.state === "open"
                ? { wholeAction: { kind: "button" as const, press: props.onPick, label: labels.pick(card.key) } }
                : {})}
        >
            <Cluster gap="row" align="start">
                <Badge tone={tone ?? "neutral"}>{card.key}</Badge>
                <Stack gap="identity">
                    <Text as="p">{withInlineCode(card.label)}</Text>
                    {markOf(card, labels)}
                    {card.reason === "" ? null : (
                        <Text as="p" tone="muted">
                            {withInlineCode(card.reason)}
                        </Text>
                    )}
                </Stack>
            </Cluster>
        </SurfaceCard>
    )
}

/** The demo code: the lines in Grammar's code block named by their file, then what to look at and the key lines. */
const CodePassage = (props: { readonly code: EssenceCode; readonly labels: EssenceLabels["opener"] }) => {
    const { code, labels } = props
    const end = code.start + code.code.split("\n").length - 1
    return (
        <Passage label={labels.code}>
            <FencedCodeBlock language={code.lang} label={`${code.file}:${code.start}-${end}`}>
                <HighlightedCode code={code.code} language={code.lang} />
            </FencedCodeBlock>
            <Text role="caption" tone="muted">
                {`${code.file} · ${labels.lines(code.start, end)}${code.highlight.length === 0 ? "" : ` · ${labels.keyLines(code.highlight.join(", "))}`}`}
            </Text>
            <Text as="p">{withInlineCode(code.note)}</Text>
        </Passage>
    )
}

/**
 * What the right pick opens, and only it, as one reading flow on one card split by hairlines: Vì sao (the essence in the larger type,
 * the figure of what happened, the longer story folded), the demo code from the lesson's source, what the interviewer wanted to know (never
 * before the answer), then what to say in an interview.
 */
const WhyCard = (props: {
    readonly insight: EssenceInsight
    readonly probe: string
    readonly labels: EssenceLabels["opener"]
}) => {
    const { insight, labels } = props
    return (
        <SurfaceCard ariaLabel={labels.whyTitle}>
            <Stack gap="section">
                <Passage label={labels.whyTitle}>
                    <Text as="p" role="title.section">
                        {withInlineCode(insight.essence)}
                    </Text>
                </Passage>
                {insight.diagram === "" ? null : (
                    <MermaidDiagram
                        source={insight.diagram}
                        label={labels.diagram}
                        errorTitle={labels.diagramError}
                        height="md"
                    />
                )}
                {insight.why === "" ? null : (
                    <Disclosure
                        kind="quiet"
                        title={labels.more}
                        body={<Text as="p">{withInlineCode(insight.why)}</Text>}
                    />
                )}
                {insight.code === undefined ? null : (
                    <>
                        <Divider semantics="presentation" />
                        <CodePassage code={insight.code} labels={labels} />
                    </>
                )}
                {props.probe === "" ? null : (
                    <>
                        <Divider semantics="presentation" />
                        <Passage label={labels.probe}>
                            <Text as="p">{withInlineCode(props.probe)}</Text>
                        </Passage>
                    </>
                )}
                <Divider semantics="presentation" />
                <Passage label={labels.interview}>
                    <Quote text={insight.interview.replaceAll("`", "")} />
                </Passage>
            </Stack>
        </SurfaceCard>
    )
}

/** The hint: how the question works, and where in Bản chất (or which scenario) the answer is explained. */
const HintPopover = (props: { readonly question: EssenceQuestionView; readonly labels: EssenceLabels["opener"] }) => (
    <Popover title={props.labels.hintAction} size="sm" trigger={<Button>{props.labels.hintAction}</Button>}>
        <Stack gap="inline">
            <Text as="p">{props.labels.hint}</Text>
            {props.question.links.map((link) => (
                <Link key={link.id} href={link.href}>
                    {link.label}
                </Link>
            ))}
        </Stack>
    </Popover>
)

/**
 * Mở đầu, one interview question at a time: the header (its time, "Câu n / 5 · Mở đầu" and its short title), Ngữ cảnh (the business,
 * the timeline, what is happening and its result, the system touched folded), then the question and its options as large pressable
 * cards. A wrong pick turns its card danger, locks it and shows why under it; the right pick turns success and opens Vì sao, the demo
 * code, what the interviewer wanted to know and what to say in an interview. "Câu tiếp theo" waits for the right pick; "Gợi ý" says where to read.
 */
export const LessonOpener = (props: LessonOpenerProps) => {
    const { view, question, labels, isLoading } = props
    const opener = labels.opener
    const cards = optionCardsOf(question)
    return (
        <Stack gap="region" measure="reading">
            <Stack gap="identity">
                <Cluster gap="inline" align="center">
                    {question.event === undefined ? null : (
                        <Badge tone="neutral" isLoading={isLoading}>
                            {question.event.at}
                        </Badge>
                    )}
                    <Text role="caption" tone="muted" isLoading={isLoading}>
                        {view.caption}
                    </Text>
                </Cluster>
                <Text as="p" role="title.page" isLoading={isLoading}>
                    {question.title === "" ? withInlineCode(question.prompt) : question.title}
                </Text>
            </Stack>
            <ContextCard view={view} question={question} labels={opener} isLoading={isLoading} />
            <Stack gap="section">
                <Passage label={opener.question} isLoading={isLoading}>
                    <Text as="p" role="title.section" isLoading={isLoading}>
                        {withInlineCode(question.prompt)}
                    </Text>
                    <Text role="caption" tone="muted" isLoading={isLoading}>
                        {opener.noPenalty}
                    </Text>
                </Passage>
                <Stack gap="inline">
                    {cards.map((card) => (
                        <OptionCardView
                            key={card.id}
                            card={card}
                            labels={opener}
                            isLoading={isLoading}
                            onPick={() => props.onAnswer(question.id, card.id)}
                        />
                    ))}
                </Stack>
                {question.isSendFailed ? (
                    <Alert
                        tone="negative"
                        title={opener.sendFailed}
                        action={{ label: opener.retry, onAction: () => props.onAnswer(question.id, question.pickedId) }}
                    />
                ) : null}
                {isGrading(question) ? <InlineStatus state="running" label={opener.grading} /> : null}
            </Stack>
            {question.isSolved ? (
                question.insight === undefined ? (
                    <Text as="p">{withInlineCode(question.explanation)}</Text>
                ) : (
                    <WhyCard insight={question.insight} probe={question.probe} labels={opener} />
                )
            ) : null}
            <Cluster gap="inline" justify="between" align="center">
                <HintPopover question={question} labels={opener} />
                <Button
                    variant="primary"
                    isDisabled={!canMoveOn(question)}
                    disabledReason={opener.nextWait}
                    isLoading={isLoading}
                    onPress={props.onNext}
                >
                    {props.isLast ? opener.finish : opener.next}
                </Button>
            </Cluster>
        </Stack>
    )
}
