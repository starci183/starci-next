import {
    Alert,
    Badge,
    Button,
    Cluster,
    DescriptionList,
    Disclosure,
    Divider,
    FencedCodeBlock,
    InlineStatus,
    Link,
    MermaidDiagram,
    Popover,
    Quote,
    Section,
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

/** A Mermaid figure with the one line under it that says where to look. */
const Figure = (props: {
    readonly source: string
    readonly caption: string
    readonly label: string
    readonly errorTitle: string
    readonly height?: "sm" | "md"
    readonly isLoading?: boolean
}) => (
    <Stack gap="identity">
        <MermaidDiagram
            source={props.source}
            label={props.label}
            errorTitle={props.errorTitle}
            height={props.height ?? "sm"}
            isLoading={props.isLoading === true}
        />
        {props.caption === "" ? null : (
            <Text role="caption" tone="muted">
                {props.caption}
            </Text>
        )}
    </Stack>
)

/** Numbered steps as Grammar's list: each its words (and who acts, when given); a faulty step on the danger edge with its mark. */
const StepList = (props: {
    readonly label: string
    readonly steps: ReadonlyArray<{ readonly who: string; readonly text: string; readonly isFault: boolean }>
    readonly faultLabel: string
    readonly isLoading?: boolean
}) => (
    <Section
        kind="list"
        ariaLabel={props.label}
        empty={null}
        isLoading={props.isLoading === true}
        items={props.steps.map((step, index) => ({
            id: `${index}`,
            title: step.text.replaceAll("`", ""),
            leading: { position: index + 1 },
            ...(step.who === "" ? {} : { description: step.who }),
            ...(step.isFault
                ? { verdict: "danger" as const, value: <InlineStatus state="error" label={props.faultLabel} /> }
                : {}),
        }))}
    />
)

/**
 * The top of Mở đầu: the whole system once (open on the first question, folded on the others) and the lesson's glossary, folded.
 * Grammar has no dotted glossary term yet, so the glossary is a list here.
 */
const Overview = (props: { readonly view: EssenceView; readonly labels: EssenceLabels["opener"] }) => {
    const { view, labels } = props
    const story = view.story
    if (story === undefined || (story.system === undefined && story.glossary.length === 0)) return null
    return (
        <Stack gap="inline">
            {story.system === undefined ? null : (
                <Disclosure
                    key={`overview-${view.index === 0 ? "open" : "folded"}`}
                    kind="quiet"
                    title={labels.overview}
                    defaultExpanded={view.index === 0}
                    body={
                        <Figure
                            source={story.system.diagram}
                            caption={story.system.caption}
                            label={labels.overview}
                            errorTitle={labels.diagramError}
                        />
                    }
                />
            )}
            {story.glossary.length === 0 ? null : (
                <Disclosure
                    kind="quiet"
                    title={labels.glossary}
                    body={
                        <DescriptionList
                            items={story.glossary.map((entry) => ({
                                id: entry.term,
                                term: entry.term,
                                description: entry.definition,
                            }))}
                        />
                    }
                />
            )}
        </Stack>
    )
}

/**
 * Ngữ cảnh: the business (its line and three key figures), the timeline of the night with the moment on screen current, what is
 * happening now, the situation as numbered steps in business words and its result; then, folded, Bối cảnh (the small system diagram with
 * the touched parts named, open on the first question only) and Chi tiết kỹ thuật (the only place for code and table names before the
 * answer).
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
                {question.steps.length === 0 ? null : (
                    <Passage label={labels.situation} isLoading={isLoading}>
                        <StepList
                            label={labels.situation}
                            steps={question.steps.map((text) => ({ who: "", text, isFault: false }))}
                            faultLabel={labels.faultStep}
                            isLoading={isLoading}
                        />
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
                        key={`context-${question.id}`}
                        kind="quiet"
                        title={labels.system}
                        defaultExpanded={view.index === 0}
                        body={
                            <Figure
                                source={question.contextDiagram}
                                caption={question.contextCaption}
                                label={labels.system}
                                errorTitle={labels.diagramError}
                                isLoading={isLoading}
                            />
                        }
                    />
                )}
                {question.technical === "" ? null : (
                    <Disclosure
                        key={`technical-${question.id}`}
                        kind="quiet"
                        title={labels.technical}
                        body={<Text as="p">{withInlineCode(question.technical)}</Text>}
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

/** The demo code: the lines in Grammar's code block named by their file and range, then the key lines and what to look at. */
const CodePassage = (props: { readonly code: EssenceCode; readonly labels: EssenceLabels["opener"] }) => {
    const { code, labels } = props
    const end = code.start + code.code.split("\n").length - 1
    return (
        <Stack gap="identity">
            <FencedCodeBlock language={code.lang} label={`${code.file}:${code.start}-${end}`}>
                <HighlightedCode code={code.code} language={code.lang} />
            </FencedCodeBlock>
            <Text role="caption" tone="muted">
                {`${code.file} · ${labels.lines(code.start, end)}${code.highlight.length === 0 ? "" : ` · ${labels.keyLines(code.highlight.join(", "))}`}`}
            </Text>
            <Text as="p">{withInlineCode(code.note)}</Text>
        </Stack>
    )
}

/** The interview answer: the four beats when the question has them, else the one quoted answer. */
const InterviewAnswer = (props: { readonly insight: EssenceInsight; readonly labels: EssenceLabels["opener"] }) => {
    const { insight, labels } = props
    if (insight.interviewBeats === undefined) return <Quote text={insight.interview.replaceAll("`", "")} />
    const beats = insight.interviewBeats
    return (
        <DescriptionList
            items={(["symptom", "cause", "fix", "cost"] as const).map((beat) => ({
                id: beat,
                term: labels.beats[beat],
                description: withInlineCode(beats[beat]),
            }))}
        />
    )
}

/**
 * What the right pick opens, and only it, as one reading flow on one card split by hairlines: Chuyện gì đã xảy ra (numbered steps,
 * the faulty one on the danger edge), Gốc rễ (one sentence in the larger type), Cách sửa bằng lời thường, the explanation figure with
 * its caption, Cái giá, the code (folded), what the interviewer wanted to know (never before the answer), then the interview answer in
 * four beats. An opener written before the four beats keeps its essence, figure, longer story and quoted answer.
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
                <Text role="title.section">{labels.whyTitle}</Text>
                {insight.happened.length === 0 ? null : (
                    <Passage label={labels.happened}>
                        <StepList label={labels.happened} steps={insight.happened} faultLabel={labels.faultStep} />
                    </Passage>
                )}
                <Passage label={labels.root}>
                    <Text as="p" role="title.section">
                        {withInlineCode(insight.essence)}
                    </Text>
                </Passage>
                {insight.fix === "" ? null : (
                    <Passage label={labels.fix}>
                        <Text as="p">{withInlineCode(insight.fix)}</Text>
                    </Passage>
                )}
                {insight.diagram === "" ? null : (
                    <Figure
                        source={insight.diagram}
                        caption={insight.diagramCaption}
                        label={labels.diagram}
                        errorTitle={labels.diagramError}
                        height="md"
                    />
                )}
                {insight.cost === "" ? null : (
                    <Passage label={labels.cost}>
                        <Text as="p">{withInlineCode(insight.cost)}</Text>
                    </Passage>
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
                        <Disclosure
                            kind="quiet"
                            title={labels.code}
                            body={<CodePassage code={insight.code} labels={labels} />}
                        />
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
                    <InterviewAnswer insight={insight} labels={labels} />
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
 * Mở đầu, one interview question at a time: the whole system and the glossary at the top, the header (its time, "Câu n / 5 · Mở đầu"
 * and its short title), Ngữ cảnh (the business, the timeline, what is happening, the numbered situation and its result, Bối cảnh and
 * Chi tiết kỹ thuật folded), then the question, which states its constraint, and its options as large pressable cards. A wrong pick turns
 * its card danger, locks it and shows why under it; the right pick turns success and opens Vì sao. "Câu tiếp theo" waits for the right pick; "Gợi ý" says where to read.
 */
export const LessonOpener = (props: LessonOpenerProps) => {
    const { view, question, labels, isLoading } = props
    const opener = labels.opener
    const cards = optionCardsOf(question)
    return (
        <Stack gap="region" measure="reading">
            <Overview view={view} labels={opener} />
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
