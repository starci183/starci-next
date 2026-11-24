import {
    Alert,
    Button,
    Cluster,
    CodeBlock,
    DataTable,
    type DataTableColumn,
    type DataTableProps,
    DescriptionList,
    Disclosure,
    Drawer,
    GradedChoice,
    type GradedChoiceVerdict,
    Image,
    InlineStatus,
    Markdown,
    type MarkdownLabels,
    PinnedActionBar,
    Quote,
    Sidenotes,
    Stack,
    Text,
} from "@starci/grammar/common"
import { MermaidDiagram } from "@starci/grammar/core/ext/graph"
import { createContext, useContext, type ReactNode } from "react"
import { LessonCode } from "../LessonCode"
import {
    fenceOf,
    paragraphsOf,
    plainWordsOf,
    termIdOf,
    termsUsedIn,
    withInlineCode,
    withTerms,
    type GlossaryEntry,
} from "./inline"
import { canMoveOn, isGrading, optionCardsOf, type OptionCard } from "./state"
import type {
    EssenceCode,
    EssenceIllustration,
    EssenceInsight,
    EssenceLabels,
    EssenceQuestionView,
    EssenceStep,
    EssenceStory,
    EssenceView,
} from "./types"

/** What the opener needs. */
export type LessonOpenerProps = {
    readonly view: EssenceView
    readonly question: EssenceQuestionView
    readonly labels: EssenceLabels
    readonly isLoading: boolean
    /** True for the last question: the command of the right pick leads to the result. */
    readonly isLast: boolean
    /** True at phone width: the next command is pinned to the bottom edge and the terms fold under the prose. */
    readonly isPhone: boolean
    /** Picks an option and sends it to be graded on the spot. */
    readonly onAnswer: (activityId: string, optionId: string) => void
    /** Moves to the next question (or to the result after the last one). */
    readonly onNext: () => void
    /** Copies a text (the interview answer) to the learner's clipboard. */
    readonly onCopy: (text: string) => void
    /** The public base of the app's statics: the pictures of the story and the logos of the system figure are served from it. */
    readonly staticsBase: string
}

type OpenerLabels = EssenceLabels["opener"]

/** A heading of the reading column and the passage under it. */
const Passage = (props: { readonly title: string; readonly children: ReactNode; readonly isLoading?: boolean }) => (
    <Stack gap="row">
        <Text role="title.section" isLoading={props.isLoading === true}>
            {props.title}
        </Text>
        {props.children}
    </Stack>
)

/** The words of Grammar's markdown (the fence's Copy and its language label), given once by the opener to every snippet under it. */
const MarkdownWords = createContext<MarkdownLabels | undefined>(undefined)

/**
 * A demo snippet the prose carries between its paragraphs (a fenced block of the authored text): Grammar's fenced code block, its body
 * coloured by the lesson's highlighter (Shiki, `LessonCode`) as every lesson fence is, its comments written in both languages by the author.
 */
const Snippet = (props: { readonly fence: string }) => {
    const words = useContext(MarkdownWords)
    return (
        <Markdown
            source={props.fence}
            {...(words === undefined ? {} : { labels: words })}
            renderCode={(code) => <LessonCode code={code} />}
        />
    )
}

/**
 * Prose paragraphs as the learner reads them, each with its code, its strong spans and (when given) its glossary terms marked; a
 * paragraph that is a fenced code block draws as a {@link Snippet} in its place, like code in a blog post.
 */
const Prose = (props: {
    readonly paragraphs: ReadonlyArray<string>
    readonly labels: OpenerLabels
    readonly terms?: ReadonlyArray<GlossaryEntry>
    readonly isLoading?: boolean
}) => (
    <>
        {props.paragraphs.map((paragraph, index) => {
            const key = `${index}-${paragraph.slice(0, 24)}`
            if (fenceOf(paragraph) !== undefined) return <Snippet key={key} fence={paragraph} />
            return (
                <Text key={key} as="p" role="reading.body" isLoading={props.isLoading === true}>
                    {props.terms === undefined ? withInlineCode(paragraph) : withTerms(paragraph, props.terms)}
                </Text>
            )
        })}
    </>
)

/**
 * The scene of a question (Chuyện gì xảy ra): its paragraphs (a step may hold a fenced snippet, which stands as its own block), the
 * symptom closing the last paragraph of words after one space, or standing after a closing snippet.
 */
const sceneOf = (question: EssenceQuestionView): ReadonlyArray<string> => {
    const paragraphs = question.steps.flatMap((step) => paragraphsOf(step))
    if (question.symptom === "") return paragraphs
    const last = paragraphs[paragraphs.length - 1]
    if (last === undefined || fenceOf(last) !== undefined) return [...paragraphs, question.symptom]
    return [...paragraphs.slice(0, -1), `${last} ${question.symptom}`]
}

/**
 * A picture of the story (Bối cảnh or a question's scene): the brand illustration at its own square ratio, kept to a reading width so
 * it never towers over the prose; its alt text says what it shows.
 */
const Illustration = (props: { readonly picture: EssenceIllustration; readonly staticsBase: string }) => (
    <div style={{ width: "100%", maxWidth: "26rem" }}>
        <Image
            src={`${props.staticsBase}/${props.picture.key}`}
            alt={props.picture.alt}
            ratio="1:1"
            fit="contain"
            width={1024}
            height={1024}
            loading="lazy"
        />
    </div>
)

/** The logos a system figure's nodes may name (`R@{ icon: "redis" }`), served from the app's `statics/logos/`. */
const FIGURE_LOGOS: ReadonlyArray<string> = ["redis", "postgresql"]

/** The logos of the system figure as the Grammar draws them before a node's words: the vendor's own mark, decorative. */
const figureIconsOf = (staticsBase: string): Readonly<Record<string, ReactNode>> =>
    Object.fromEntries(
        FIGURE_LOGOS.map((name) => [
            name,
            <Image key={name} src={`${staticsBase}/logos/${name}.svg`} alt="" width={18} height={18} loading="eager" />,
        ]),
    )

/**
 * A margin note of the glossary: the one-line definition and, when the term ships Học thêm, the command that opens it in a side sheet
 * (a bottom sheet on a phone): a few sentences and the demo code, the prose drawn as the rest of the lesson.
 */
const TermNote = (props: {
    readonly entry: GlossaryEntry
    readonly labels: OpenerLabels
    readonly isPhone: boolean
}) => {
    const { entry, labels } = props
    if (entry.more === undefined || entry.more === "") return <>{entry.definition}</>
    return (
        <Stack gap="identity">
            <Text as="span">{entry.definition}</Text>
            <Drawer
                title={entry.term}
                description={entry.definition}
                closeLabel={labels.learnMoreClose}
                placement={props.isPhone ? "bottom" : "right"}
                width="wide"
                trigger={
                    <Button variant="border" size="sm">
                        {labels.learnMore}
                    </Button>
                }
            >
                <Stack gap="row">
                    <Prose paragraphs={paragraphsOf(entry.more)} labels={labels} />
                </Stack>
            </Drawer>
        </Stack>
    )
}

/**
 * The opening of Mở đầu, before question 1: the eyebrow ("Mở đầu · 5 câu · một đêm"), the story's title, its hook as the lede, Bối
 * cảnh's picture, Bối cảnh in paragraphs (its snippets between them), then the whole system as a Mermaid flowchart: the logos on the
 * parts that name one, the links coloured by path with their legend, and the caption.
 */
const Opening = (props: {
    readonly story: EssenceStory
    readonly total: number
    readonly labels: OpenerLabels
    readonly terms: ReadonlyArray<GlossaryEntry>
    readonly isLoading: boolean
    readonly staticsBase: string
}) => {
    const { story, labels, terms, isLoading } = props
    return (
        <Stack gap="section">
            <Stack gap="row">
                <Text role="caption" isLoading={isLoading}>
                    {labels.opening(props.total)}
                </Text>
                <Text as="p" role="reading.title" isLoading={isLoading}>
                    {withInlineCode(story.title)}
                </Text>
                {story.hook === "" ? null : (
                    <Text as="p" role="reading.body" isLoading={isLoading}>
                        {withTerms(story.hook, terms)}
                    </Text>
                )}
            </Stack>
            {story.illustration === undefined ? null : (
                <Illustration picture={story.illustration} staticsBase={props.staticsBase} />
            )}
            {story.body === "" ? null : (
                <Passage title={labels.context} isLoading={isLoading}>
                    <Prose paragraphs={paragraphsOf(story.body)} labels={labels} terms={terms} isLoading={isLoading} />
                </Passage>
            )}
            {story.system === undefined ? null : (
                <MermaidDiagram
                    source={story.system.diagram}
                    label={labels.overview}
                    errorTitle={labels.diagramError}
                    isLoading={isLoading}
                    icons={figureIconsOf(props.staticsBase)}
                    {...(story.system.legend.length === 0 ? {} : { legend: story.system.legend })}
                    {...(story.system.caption === "" ? {} : { caption: story.system.caption })}
                />
            )}
        </Stack>
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
    if (beats === undefined) return plainWordsOf(insight.interview)
    return (["symptom", "cause", "fix", "cost"] as const)
        .map((beat) => `${labels.beats[beat]}: ${plainWordsOf(beats[beat])}`)
        .join("\n")
}

/** The interview answer: the four beats when the question has them (with the copy command), else the one quoted answer. */
const InterviewAnswer = (props: {
    readonly insight: EssenceInsight
    readonly labels: OpenerLabels
    readonly onCopy: (text: string) => void
}) => {
    const { insight, labels } = props
    if (insight.interviewBeats === undefined) return <Quote text={plainWordsOf(insight.interview)} />
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

/** A run of rows of the walk-through table under one group heading. */
type WalkGroup = NonNullable<DataTableProps<WalkRow>["groups"]>[number]

/** One row of the walk-through table: its step number and the step it draws. */
type WalkRow = {
    readonly id: string
    readonly number: number
    readonly step: EssenceStep
    readonly edgeTone?: "danger"
}

/**
 * The rows of the walk-through table in groups: a step that carries a group label starts a new group; steps before the first label
 * form an unlabelled group. Undefined when no step carries a label (the table is one flat list).
 */
const walkGroupsOf = (rows: ReadonlyArray<WalkRow>): ReadonlyArray<WalkGroup> | undefined => {
    if (rows.every((row) => row.step.group === "")) return undefined
    const groups: Array<{ id: string; label: string; rows: Array<WalkRow> }> = []
    for (const row of rows) {
        const last = groups[groups.length - 1]
        if (row.step.group !== "" || last === undefined)
            groups.push({ id: `group-${row.id}`, label: row.step.group, rows: [row] })
        else last.rows.push(row)
    }
    return groups
}

/**
 * Đi từng bước: Grammar's table of the walk-through, numbered steps (who acts in strong, then what happens) and, when the insight names
 * it, a third column of what the watched part holds after each step; the faulty step on the danger edge with its "chỗ hỏng" status;
 * rows grouped where a step starts a group. A question without the third column reads as two columns.
 */
const WalkThrough = (props: { readonly insight: EssenceInsight; readonly labels: OpenerLabels }) => {
    const { insight, labels } = props
    const rows: ReadonlyArray<WalkRow> = insight.happened.map((step, index) => ({
        id: `${index}`,
        number: index + 1,
        step,
        ...(step.isFault ? { edgeTone: "danger" as const } : {}),
    }))
    const columns: ReadonlyArray<DataTableColumn<WalkRow>> = [
        { id: "number", label: labels.step, isNumeric: true, width: "fit" },
        { id: "what", label: labels.stepWhat, width: "fill", isRowHeader: true },
        ...(insight.stateLabel === "" ? [] : [{ id: "state", label: insight.stateLabel }]),
    ]
    const renderCell = (row: WalkRow, columnId: string): ReactNode => {
        if (columnId === "number") return row.number
        if (columnId === "state") return withInlineCode(row.step.state)
        return (
            <Stack gap="identity">
                <Text>
                    {row.step.who === "" ? null : (
                        <>
                            <Text as="span" isStrong>
                                {row.step.who}
                            </Text>{" "}
                        </>
                    )}
                    {withInlineCode(row.step.text)}
                </Text>
                {row.step.isFault ? <InlineStatus state="error" label={labels.faultStep} /> : null}
            </Stack>
        )
    }
    const groups = walkGroupsOf(rows)
    return groups === undefined ? (
        <DataTable
            label={labels.walkthrough}
            columns={columns}
            rows={rows}
            renderCell={renderCell}
            emptyContent={null}
            phone="table"
        />
    ) : (
        <DataTable
            label={labels.walkthrough}
            columns={columns}
            groups={groups}
            renderCell={renderCell}
            emptyContent={null}
            phone="table"
        />
    )
}

/**
 * Xem kỹ thuật, folded: the code and table names, Đi từng bước (the table), the prose of `why`, the figure with its caption, Lưu ý,
 * the code (folded), what the interviewer wants to know, then the interview answer in four beats with its copy command.
 */
const Technical = (props: {
    readonly question: EssenceQuestionView
    readonly insight: EssenceInsight
    readonly labels: OpenerLabels
    readonly onCopy: (text: string) => void
}) => {
    const { question, insight, labels } = props
    return (
        <Stack gap="section">
            {question.technical === "" ? null : (
                <Text as="p" role="reading.body">
                    {withInlineCode(question.technical)}
                </Text>
            )}
            {insight.happened.length === 0 ? null : (
                <Passage title={labels.walkthrough}>
                    <WalkThrough insight={insight} labels={labels} />
                </Passage>
            )}
            <Prose paragraphs={paragraphsOf(insight.why)} labels={labels} />
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
            {insight.cost === "" ? null : (
                <Passage title={labels.cost}>
                    <Prose paragraphs={paragraphsOf(insight.cost)} labels={labels} />
                </Passage>
            )}
            {insight.code === undefined ? null : <CodePassage code={insight.code} labels={labels} />}
            {question.probe === "" ? null : (
                <Passage title={labels.probe}>
                    <Text as="p" role="reading.body">
                        {withInlineCode(question.probe)}
                    </Text>
                </Passage>
            )}
            <Passage title={labels.interview}>
                <InterviewAnswer insight={insight} labels={labels} onCopy={props.onCopy} />
            </Passage>
        </Stack>
    )
}

/**
 * What the right pick opens, and only it: Vì sao (anh Senior's picture as a quote, the paragraph that names the term, Cách sửa), Xem
 * kỹ thuật folded, then "Nói gọn:" with the essence as the take-away line.
 */
const Why = (props: {
    readonly question: EssenceQuestionView
    readonly insight: EssenceInsight
    readonly labels: OpenerLabels
    readonly terms: ReadonlyArray<GlossaryEntry>
    readonly onCopy: (text: string) => void
}) => {
    const { question, insight, labels, terms } = props
    return (
        <Stack gap="section">
            <Text role="title.page">{labels.whyTitle}</Text>
            {insight.analogy === "" ? null : <Quote source={labels.senior} text={plainWordsOf(insight.analogy)} />}
            {insight.term === "" ? null : (
                <Text as="p" role="reading.body">
                    {withTerms(insight.term, terms)}
                </Text>
            )}
            {insight.fix === "" ? null : (
                <Passage title={labels.fix}>
                    <Prose paragraphs={paragraphsOf(insight.fix)} labels={labels} terms={terms} />
                </Passage>
            )}
            <Disclosure
                key={`technical-${question.id}`}
                title={labels.technical}
                summary={labels.technicalSummary}
                body={<Technical question={question} insight={insight} labels={labels} onCopy={props.onCopy} />}
            />
            {insight.essence === "" ? null : (
                <Text as="p" role="reading.body">
                    <Text as="span" isStrong>
                        {labels.inShort}
                    </Text>{" "}
                    {withInlineCode(insight.essence)}
                </Text>
            )}
        </Stack>
    )
}

/** The closing of the opener once the last question is solved: "Hết đêm", its paragraphs, then the one question to the reader. */
const Closing = (props: {
    readonly closing: { readonly body: string; readonly question: string }
    readonly labels: OpenerLabels
}) => (
    <Stack gap="row">
        <Text role="title.page">{props.labels.closingTitle}</Text>
        <Prose paragraphs={paragraphsOf(props.closing.body)} labels={props.labels} />
        <Text as="p" role="reading.body" isStrong>
            {withInlineCode(props.closing.question)}
        </Text>
    </Stack>
)

/** The prose that marks its terms (the margin notes stand level with them): the opening, the scene and, once solved, Vì sao. */
const wordsOf = (
    question: EssenceQuestionView,
    story: EssenceStory | undefined,
    insight: EssenceInsight | undefined,
): ReadonlyArray<string> => [
    ...(story === undefined ? [] : [story.hook, story.body]),
    ...question.steps,
    question.symptom,
    ...(insight === undefined ? [] : [insight.term, insight.fix]),
]

/**
 * Mở đầu, one interview question at a time. Before question 1 the opening (eyebrow, the story's title, the hook, Bối cảnh, the system
 * figure); then per question the eyebrow ("Câu 2 / 5 · 23:58") and the title, Chuyện gì xảy ra in paragraphs (the symptom closing
 * the last), the question in bold and the four options; a wrong pick shows its own reason and the learner picks again. Only the right
 * pick opens Vì sao (the quote of anh Senior, the term, Cách sửa), Xem kỹ thuật folded and "Nói gọn:". Once solved, a one-line hand-off
 * names the next development of the night beside "Câu tiếp theo"; after the last question, the closing (Hết đêm) stands before the
 * finish command. The glossary terms the prose uses stand in the margin before and after the answer.
 */
export const LessonOpener = (props: LessonOpenerProps) => {
    const { view, question, labels, isLoading, isPhone } = props
    const opener = labels.opener
    const cards = optionCardsOf(question)
    const insight = question.isSolved ? question.insight : undefined
    const story = view.index === 0 ? view.story : undefined
    const terms = termsUsedIn(wordsOf(question, story, insight), view.story?.glossary ?? [])
    const scene = sceneOf(question)
    const next = view.questions[view.index + 1]
    const closing = question.isSolved && props.isLast ? view.story?.closing : undefined
    // The one primary of the page: beside the hand-off on a wide screen, pinned to the bottom edge in thumb reach on a phone (A-4).
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
    const handOff =
        question.isSolved && next !== undefined ? (
            next.event === undefined ? (
                next.title === "" ? null : (
                    <Text as="p">{withInlineCode(next.title)}</Text>
                )
            ) : (
                <Text as="p">
                    <Text as="span" tabular isStrong>
                        {next.event.at}
                    </Text>{" "}
                    {withInlineCode(next.event.text)}
                </Text>
            )
        ) : null
    const article = (
        <Stack gap="region">
            {story === undefined ? null : (
                <Opening
                    story={story}
                    total={view.total}
                    labels={opener}
                    terms={terms}
                    isLoading={isLoading}
                    staticsBase={props.staticsBase}
                />
            )}
            <Stack gap="row">
                <Text role="caption" tabular isLoading={isLoading}>
                    {view.caption}
                </Text>
                {question.title === "" ? null : (
                    <Text as="p" role="title.page" isLoading={isLoading}>
                        {withInlineCode(question.title)}
                    </Text>
                )}
            </Stack>
            {scene.length === 0 ? null : (
                <Passage title={opener.happened} isLoading={isLoading}>
                    {question.illustration === undefined ? null : (
                        <Illustration picture={question.illustration} staticsBase={props.staticsBase} />
                    )}
                    <Prose paragraphs={scene} labels={opener} terms={terms} isLoading={isLoading} />
                </Passage>
            )}
            <Stack gap="row">
                <Text as="p" role="reading.body" isStrong isLoading={isLoading}>
                    {withInlineCode(question.prompt)}
                </Text>
                <GradedChoice
                    grading="server"
                    label={plainWordsOf(question.prompt)}
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
                <Text as="p" role="reading.body">
                    {withInlineCode(question.explanation)}
                </Text>
            ) : null}
            {insight === undefined ? null : (
                <Why question={question} insight={insight} labels={opener} terms={terms} onCopy={props.onCopy} />
            )}
            {closing === undefined ? null : <Closing closing={closing} labels={opener} />}
            <Cluster gap="inline" justify="between" align="center">
                <Stack gap="identity">{handOff}</Stack>
                {isPhone ? null : nextButton}
            </Cluster>
            {isPhone ? <PinnedActionBar label={opener.next}>{nextButton}</PinnedActionBar> : null}
        </Stack>
    )
    // The terms the prose uses stand in the margin beside it, before and after the answer (folded under it on a narrow frame).
    return (
        <MarkdownWords.Provider value={labels.markdown}>
            {terms.length === 0 ? (
                article
            ) : (
                <Sidenotes
                    title={opener.termsAside}
                    foldLabel={opener.termsFold}
                    notes={terms.map((entry) => ({
                        id: termIdOf(entry),
                        term: entry.term,
                        note: <TermNote entry={entry} labels={opener} isPhone={isPhone} />,
                    }))}
                >
                    {article}
                </Sidenotes>
            )}
        </MarkdownWords.Provider>
    )
}
