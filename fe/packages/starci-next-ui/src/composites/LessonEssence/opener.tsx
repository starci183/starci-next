import {
    Alert,
    Button,
    Cluster,
    DescriptionList,
    CodeBlock,
    Disclosure,
    Divider,
    GradedChoice,
    type GradedChoiceVerdict,
    IconTile,
    InlineStatus,
    MermaidDiagram,
    PinnedActionBar,
    PrimaryRailLayout,
    Quote,
    Section,
    Sidenotes,
    Stack,
    Stepper,
    SurfaceCard,
    TableOfContents,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { InterviewerGlyph } from "../../leaves/Icon"
import { termIdOf, termsUsedIn, withInlineCode, withTerms, type GlossaryEntry } from "./inline"
import { canMoveOn, isGrading, optionCardsOf, type OptionCard } from "./state"
import type { EssenceCode, EssenceInsight, EssenceLabels, EssenceQuestionView, EssenceView } from "./types"

/** What the opener needs. */
export type LessonOpenerProps = {
    readonly view: EssenceView
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
    /** True for the last question: the command of the right pick leads to the result. */
    readonly isLast: boolean
    /** True at phone width: no side columns; the time joins the eyebrow and the terms fold under the situation. */
    readonly isPhone: boolean
    /** Picks an option and sends it to be graded on the spot. */
    readonly onAnswer: (activityId: string, optionId: string) => void
    /** Moves to the next question (or to the result after the last one). */
    readonly onNext: () => void
    /** Copies a text (the interview answer) to the learner's clipboard. */
    readonly onCopy: (text: string) => void
}

type OpenerLabels = EssenceLabels["opener"]

/** The anchors of Vì sao, in reading order, as the side navigation lists them. */
const WHY_ANCHORS = ["happened", "root", "fix", "cost", "code", "probe", "answer"] as const
type WhyAnchor = (typeof WHY_ANCHORS)[number]

/** The id of one passage of Vì sao on the page (the side navigation links to it). */
const anchorId = (anchor: WhyAnchor): string => `opener-why-${anchor}`

/** A labelled passage: its small label, then its words or its figure. */
const Passage = (props: { readonly label: string; readonly children: ReactNode; readonly isLoading?: boolean }) => (
    <Stack gap="identity">
        <Text role="label.field" isLoading={props.isLoading === true}>
            {props.label}
        </Text>
        {props.children}
    </Stack>
)

/** Numbered steps as Grammar's list: each its words (and who acts, when given); a faulty step on the danger edge with its mark. */
const StepList = (props: {
    readonly label: string
    readonly steps: ReadonlyArray<{ readonly who: string; readonly text: string; readonly isFault: boolean }>
    readonly faultLabel: string
    readonly isLoading?: boolean
    /** The glossary terms the steps mark in place (the situation); the steps of Vì sao mark none. */
    readonly terms?: ReadonlyArray<GlossaryEntry>
}) => (
    <Section
        kind="list"
        ariaLabel={props.label}
        empty={null}
        isLoading={props.isLoading === true}
        items={props.steps.map((step, index) => ({
            id: `${index}`,
            title: step.text.replaceAll("`", ""),
            // The words of a step read as prose (regular weight), with its terms marked; only "Kết quả" stands out.
            titleContent: (
                <Text as="span" role="reading.body">
                    {withTerms(step.text, props.terms ?? [])}
                </Text>
            ),
            leading: { position: index + 1 },
            ...(step.who === "" ? {} : { description: step.who }),
            ...(step.isFault
                ? { verdict: "danger" as const, value: <InlineStatus state="error" label={props.faultLabel} /> }
                : {}),
        }))}
    />
)

/** The words of a sentence without its backticks, for an accessible name. */
const withoutCode = (text: string): string => text.replaceAll("`", "")

/** The label of one moment on the strip of the night: its time in the story, or "Câu N" when the question carries none. */
const momentOf = (question: EssenceQuestionView, index: number, labels: OpenerLabels): string =>
    question.event?.at ?? labels.questionNumber(index + 1)

/** The five moments of the night, one per question: the one on screen current, the solved ones checked. */
const NightStrip = (props: {
    readonly view: EssenceView
    readonly labels: OpenerLabels
    readonly isLoading: boolean
}) => {
    const { view, labels } = props
    const current = view.questions[view.index]
    return (
        <Stepper
            label={labels.barLabel}
            currentStepId={current?.id ?? ""}
            isLoading={props.isLoading}
            steps={view.questions.map((question, index) => ({
                id: question.id,
                label: momentOf(question, index, labels),
                state: question.isSolved ? "complete" : index === view.index ? "current" : "upcoming",
            }))}
        />
    )
}

/** The question as the interviewer asks it: the avatar and its label, the question, then the condition the right option must meet. */
const InterviewerAsks = (props: {
    readonly question: EssenceQuestionView
    readonly labels: OpenerLabels
    readonly terms: ReadonlyArray<GlossaryEntry>
    readonly isLoading: boolean
}) => {
    const { question, labels, isLoading } = props
    return (
        <Stack gap="inline">
            <Cluster gap="inline" align="center">
                <IconTile source={InterviewerGlyph} tone="neutral" isLoading={isLoading} />
                <Text role="label.field" isLoading={isLoading}>
                    {labels.interviewerAsks}
                </Text>
            </Cluster>
            <Stack gap="inline">
                <Text as="p" role="reading.title" isLoading={isLoading}>
                    {withInlineCode(question.prompt)}
                </Text>
                {question.condition === "" ? null : (
                    <Text as="p" role="reading.body" isLoading={isLoading}>
                        <Text as="span" isStrong>{`${labels.condition}: `}</Text>
                        {withTerms(question.condition, props.terms)}
                    </Text>
                )}
            </Stack>
        </Stack>
    )
}

/** The situation: what is happening now, the numbered steps in business words, and the line "Kết quả". */
const Situation = (props: {
    readonly question: EssenceQuestionView
    readonly labels: OpenerLabels
    readonly terms: ReadonlyArray<GlossaryEntry>
    readonly isLoading: boolean
}) => {
    const { question, labels, terms, isLoading } = props
    return (
        <SurfaceCard ariaLabel={labels.situation} isLoading={isLoading}>
            <Stack gap="section">
                {question.event === undefined ? null : (
                    <Text as="p" role="reading.body" isLoading={isLoading}>
                        {withTerms(question.event.text, terms)}
                    </Text>
                )}
                {question.steps.length === 0 ? null : (
                    <StepList
                        label={labels.situation}
                        steps={question.steps.map((text) => ({ who: "", text, isFault: false }))}
                        terms={terms}
                        faultLabel={labels.faultStep}
                        isLoading={isLoading}
                    />
                )}
                {question.symptom === "" ? null : (
                    <Passage label={labels.symptom} isLoading={isLoading}>
                        <Text as="p" role="reading.body" isLoading={isLoading}>
                            {withTerms(question.symptom, terms)}
                        </Text>
                    </Passage>
                )}
            </Stack>
        </SurfaceCard>
    )
}

/**
 * What the server answered for each option, as Grammar's server-graded question takes it: a wrong pick with its reason, the right pick
 * with its reason, and once solved the reason of every option never picked. The answer key is never in the browser before a pick.
 */
const verdictsOf = (cards: ReadonlyArray<OptionCard>): Readonly<Record<string, GradedChoiceVerdict>> => {
    const verdicts: Record<string, GradedChoiceVerdict> = {}
    for (const card of cards) {
        const state =
            card.state === "wrong"
                ? "wrong"
                : card.state === "right"
                  ? "correct"
                  : card.state === "reason"
                    ? "reason"
                    : undefined
        if (state === undefined) continue
        verdicts[card.id] = card.reason === "" ? { state } : { state, explanation: withInlineCode(card.reason) }
    }
    return verdicts
}

/** The demo code: real lines of the lesson's source in Grammar's code block, numbered as the file does, the key lines marked, folded. */
const CodePassage = (props: { readonly code: EssenceCode; readonly labels: OpenerLabels }) => {
    const { code, labels } = props
    const text = code.code.replace(/\n$/u, "")
    return (
        <CodeBlock
            code={text}
            language={code.lang}
            path={code.file}
            start={code.start}
            highlightLines={code.highlight}
            note={withInlineCode(code.note)}
            defaultCollapsed
            labels={{
                copy: labels.codeCopy,
                copied: labels.codeCopied,
                copyError: labels.codeCopyError,
                lines: labels.lines,
                marked: labels.codeMarked,
            }}
        />
    )
}

/** The places of a sequence diagram's faulty messages (an arrow drawn with a cross, `-x`), counted from 1, in the danger tone. */
const faultyMessagesOf = (source: string): Readonly<Record<number, "danger">> => {
    const messages = source
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^[^\s:%]+\s*-{1,2}(?:>>|>|x|\))[+-]?\s*[^\s:]+\s*:/u.test(line))
    return Object.fromEntries(
        messages.flatMap((line, index) =>
            /-{1,2}x/u.test(line.split(":")[0] ?? "") ? [[index + 1, "danger" as const]] : [],
        ),
    )
}

/** The interview answer as one text to copy: each beat on its own line, its label first. */
const answerTextOf = (insight: EssenceInsight, labels: OpenerLabels): string => {
    const beats = insight.interviewBeats
    if (beats === undefined) return insight.interview.replaceAll("`", "")
    return (["symptom", "cause", "fix", "cost"] as const)
        .map((beat) => `${labels.beats[beat]}: ${beats[beat].replaceAll("`", "")}`)
        .join("\n")
}

/** The interview answer: the four beats when the question has them (with the copy command), else the one quoted answer. */
const InterviewAnswer = (props: {
    readonly insight: EssenceInsight
    readonly labels: OpenerLabels
    readonly onCopy: (text: string) => void
}) => {
    const { insight, labels } = props
    if (insight.interviewBeats === undefined) return <Quote text={insight.interview.replaceAll("`", "")} />
    const beats = insight.interviewBeats
    return (
        <Stack gap="row">
            <DescriptionList
                items={(["symptom", "cause", "fix", "cost"] as const).map((beat, index) => ({
                    id: beat,
                    term: `${index + 1}. ${labels.beats[beat]}`,
                    description: withInlineCode(beats[beat]),
                }))}
            />
            <Cluster gap="inline" justify="between" align="center">
                <Text tone="muted">{labels.answerOrder}</Text>
                <Button variant="border" size="sm" onPress={() => props.onCopy(answerTextOf(insight, labels))}>
                    {labels.copyAnswer}
                </Button>
            </Cluster>
        </Stack>
    )
}

/** One numbered passage of Vì sao: its anchor, its heading and its body. */
const WhySection = (props: { readonly anchor: WhyAnchor; readonly title: string; readonly children: ReactNode }) => (
    <section id={anchorId(props.anchor)} aria-label={props.title}>
        <Stack gap="row">
            <Text role="title.section">{props.title}</Text>
            {props.children}
        </Stack>
    </section>
)

/** Which passages of Vì sao this insight has, in order. */
const anchorsOf = (insight: EssenceInsight, probe: string): ReadonlyArray<WhyAnchor> =>
    WHY_ANCHORS.filter((anchor) => {
        if (anchor === "happened") return insight.happened.length > 0
        if (anchor === "fix") return insight.fix !== "" || insight.diagram !== ""
        if (anchor === "cost") return insight.cost !== ""
        if (anchor === "code") return insight.code !== undefined
        if (anchor === "probe") return probe !== ""
        return true
    })

/** The label each passage of Vì sao takes in the side navigation. */
const anchorLabelOf = (anchor: WhyAnchor, labels: OpenerLabels): string =>
    ({
        happened: labels.happened,
        root: labels.root,
        fix: labels.beats.fix,
        cost: labels.cost,
        code: labels.code,
        probe: labels.probe,
        answer: labels.interview,
    })[anchor]

/**
 * What the right pick opens, and only it: Chuyện gì đã xảy ra (numbered steps, the faulty one on the danger edge), Gốc rễ (one
 * sentence), Cách sửa bằng lời thường with its figure, Cái giá, the code (folded), what the interviewer wanted to know, then the
 * interview answer in four beats with its copy command.
 */
const Why = (props: {
    readonly insight: EssenceInsight
    readonly probe: string
    readonly labels: OpenerLabels
    readonly onCopy: (text: string) => void
}) => {
    const { insight, labels } = props
    return (
        <Stack gap="region">
            <Text role="title.page">{labels.whyTitle}</Text>
            {insight.happened.length === 0 ? null : (
                <WhySection anchor="happened" title={labels.happened}>
                    <StepList label={labels.happened} steps={insight.happened} faultLabel={labels.faultStep} />
                </WhySection>
            )}
            <section id={anchorId("root")} aria-label={labels.root}>
                <Passage label={labels.root}>
                    <Text as="p" role="title.section">
                        {withInlineCode(insight.essence)}
                    </Text>
                </Passage>
            </section>
            {insight.fix === "" && insight.diagram === "" ? null : (
                <WhySection anchor="fix" title={labels.fix}>
                    {insight.fix === "" ? null : (
                        <Text as="p" role="reading.body">
                            {withInlineCode(insight.fix)}
                        </Text>
                    )}
                    {insight.diagram === "" ? null : (
                        <MermaidDiagram
                            source={insight.diagram}
                            label={labels.diagram}
                            errorTitle={labels.diagramError}
                            height="md"
                            messageTones={faultyMessagesOf(insight.diagram)}
                            {...(insight.diagramCaption === "" ? {} : { caption: insight.diagramCaption })}
                        />
                    )}
                </WhySection>
            )}
            {insight.cost === "" ? null : (
                <WhySection anchor="cost" title={labels.cost}>
                    <Text as="p" role="reading.body">
                        {withInlineCode(insight.cost)}
                    </Text>
                </WhySection>
            )}
            {insight.why === "" ? null : (
                <Disclosure kind="quiet" title={labels.more} body={<Text as="p">{withInlineCode(insight.why)}</Text>} />
            )}
            {insight.code === undefined ? null : (
                <WhySection anchor="code" title={labels.code}>
                    <CodePassage code={insight.code} labels={labels} />
                </WhySection>
            )}
            {props.probe === "" ? null : (
                <WhySection anchor="probe" title={labels.probe}>
                    <Cluster gap="row" align="start" wrap={false}>
                        <IconTile source={InterviewerGlyph} tone="neutral" />
                        <Text as="p" role="reading.body">
                            {withInlineCode(props.probe)}
                        </Text>
                    </Cluster>
                </WhySection>
            )}
            <Divider semantics="presentation" />
            <WhySection anchor="answer" title={labels.interview}>
                <InterviewAnswer insight={insight} labels={labels} onCopy={props.onCopy} />
            </WhySection>
        </Stack>
    )
}

/** The aside after the right pick: the passages of Vì sao as Grammar's outline, sticky, following the scroll. */
const WhyOutline = (props: { readonly anchors: ReadonlyArray<WhyAnchor>; readonly labels: OpenerLabels }) => (
    <TableOfContents
        title={props.labels.inThisPart}
        items={props.anchors.map((anchor) => ({ id: anchorId(anchor), label: anchorLabelOf(anchor, props.labels) }))}
    />
)

/** The time of the question in the story, set apart at the head of the reading column, with the name of the night beside it. */
const Clock = (props: {
    readonly view: EssenceView
    readonly question: EssenceQuestionView
    readonly isLoading: boolean
}) =>
    props.question.event === undefined ? null : (
        <Cluster gap="inline" align="center">
            <Text role="figure" tabular isLoading={props.isLoading}>
                {props.question.event.at}
            </Text>
            {props.view.story === undefined ? null : (
                <Text role="caption" isLoading={props.isLoading}>
                    {props.view.story.title}
                </Text>
            )}
        </Cluster>
    )

/** The prose that marks its terms (the margin notes stand level with them): what happens, the condition, the steps and the result. */
const wordsOf = (question: EssenceQuestionView): ReadonlyArray<string> => [
    question.event?.text ?? "",
    question.condition,
    ...question.steps,
    question.symptom,
]

/**
 * Mở đầu, one interview question at a time (direction A, owner 2026-11-23, with the strip of the night and the interviewer block):
 * the time aside, the five moments of the night, the eyebrow, the interviewer's question with its condition, the situation in
 * business words with its numbered steps and "Kết quả", the small system it touches (parts only), "Chi tiết kỹ thuật" folded, then the
 * four options; a wrong pick shows its own reason and the learner picks again. Only the right pick opens Vì sao, and the aside then
 * turns from the terms of the question into the navigation of Vì sao. "Câu tiếp theo" waits for the right pick.
 */
export const LessonOpener = (props: LessonOpenerProps) => {
    const { view, question, labels, isLoading, isPhone } = props
    const opener = labels.opener
    const cards = optionCardsOf(question)
    const terms = termsUsedIn(wordsOf(question), view.story?.glossary ?? [])
    const number = view.index + 1
    const next = view.questions[view.index + 1]
    const eyebrow = [
        ...(isPhone && question.event !== undefined ? [question.event.at] : []),
        opener.questionNumber(number),
        ...(question.title === "" ? [] : [question.title]),
    ].join(" · ")
    const insight = question.isSolved ? question.insight : undefined
    // The one primary of the page: beside the next question's name on a wide screen, pinned to the bottom edge in thumb reach on a phone (A-4).
    const nextButton = (
        <Button
            variant="primary"
            {...(isPhone ? { width: "fill" as const } : {})}
            isDisabled={!canMoveOn(question)}
            disabledReason={opener.nextWait}
            isLoading={isLoading}
            onPress={props.onNext}
        >
            {props.isLast ? opener.finish : opener.next}
        </Button>
    )
    const article = (
        <Stack gap="region">
            {isPhone ? null : <Clock view={view} question={question} isLoading={isLoading} />}
            <NightStrip view={view} labels={opener} isLoading={isLoading} />
            <Stack gap="row">
                <Text role="caption" isLoading={isLoading}>
                    {eyebrow}
                </Text>
                <InterviewerAsks question={question} labels={opener} terms={terms} isLoading={isLoading} />
            </Stack>
            <Situation question={question} labels={opener} terms={terms} isLoading={isLoading} />
            {question.contextDiagram === "" ? null : (
                <Passage label={opener.relatedSystem} isLoading={isLoading}>
                    <MermaidDiagram
                        key={`context-${question.id}`}
                        source={question.contextDiagram}
                        label={opener.relatedSystem}
                        errorTitle={opener.diagramError}
                        isLoading={isLoading}
                        {...(question.contextCaption === "" ? {} : { caption: question.contextCaption })}
                    />
                </Passage>
            )}
            {question.technical === "" ? null : (
                <Disclosure
                    key={`technical-${question.id}`}
                    kind="quiet"
                    title={opener.technical}
                    body={<Text as="p">{withInlineCode(question.technical)}</Text>}
                />
            )}
            <Stack gap="inline">
                <GradedChoice
                    grading="server"
                    label={withoutCode(question.prompt)}
                    options={question.choices.map((choice) => ({ id: choice.id, label: withInlineCode(choice.label) }))}
                    verdicts={verdictsOf(cards)}
                    {...(isGrading(question) && question.pickedId !== "" ? { pendingId: question.pickedId } : {})}
                    onPick={(optionId) => props.onAnswer(question.id, optionId)}
                    labels={{
                        wrong: opener.wrongMark,
                        correct: opener.rightMark,
                        whyNot: opener.whyNot,
                        grading: opener.grading,
                    }}
                />
                {question.isSendFailed ? (
                    <Alert
                        tone="negative"
                        title={opener.sendFailed}
                        action={{ label: opener.retry, onAction: () => props.onAnswer(question.id, question.pickedId) }}
                    />
                ) : null}
                {question.isSolved ? null : (
                    <Text tone="muted" isLoading={isLoading}>
                        {question.misses.length === 0 ? opener.pickHint : opener.retryHint}
                    </Text>
                )}
            </Stack>
            {question.isSolved && insight === undefined ? (
                <Text as="p">{withInlineCode(question.explanation)}</Text>
            ) : null}
            {insight === undefined ? null : (
                <Why insight={insight} probe={question.probe} labels={opener} onCopy={props.onCopy} />
            )}
            <Cluster gap="inline" justify="between" align="center">
                <Stack gap="identity">
                    {question.isSolved && next !== undefined ? (
                        <>
                            <Text role="label.field">
                                {next.event === undefined ? opener.nextUp : `${opener.nextUp} · ${next.event.at}`}
                            </Text>
                            {next.title === "" ? null : <Text role="label.item">{next.title}</Text>}
                        </>
                    ) : null}
                </Stack>
                {isPhone ? null : nextButton}
            </Cluster>
            {isPhone ? <PinnedActionBar label={opener.next}>{nextButton}</PinnedActionBar> : null}
        </Stack>
    )
    // Before the answer the terms the question uses stand in the margin beside the prose (folded under it on a narrow frame); once
    // the right pick opens Vì sao, the margin turns into its outline and the terms read as plain words.
    if (insight === undefined) {
        return terms.length === 0 ? (
            article
        ) : (
            <Sidenotes
                title={opener.termsAside}
                foldLabel={opener.termsFold}
                notes={terms.map((entry) => ({ id: termIdOf(entry), term: entry.term, note: entry.definition }))}
            >
                {article}
            </Sidenotes>
        )
    }
    if (isPhone) return article
    return (
        <PrimaryRailLayout
            railPosition="trailing"
            railWidth="compact"
            primary={article}
            rail={<WhyOutline anchors={anchorsOf(insight, question.probe)} labels={opener} />}
        />
    )
}
