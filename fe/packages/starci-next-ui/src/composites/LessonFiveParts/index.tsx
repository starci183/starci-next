import {
    Button,
    Cluster,
    Code,
    Disclosure,
    FencedCodeBlock,
    GradedChoice,
    Grid,
    InlineStatus,
    Section,
    Sidenotes,
    Stack,
    SurfaceCard,
    TableOfContents,
    Text,
    type GradedChoiceVerdict,
} from "@starci/grammar/common"
import { Fragment, type ReactNode, type ReactElement } from "react"
import { LessonCode } from "../LessonCode"
import { RichMarkdown, type RichDrawing } from "../RichMarkdown"
import type { ReadingChapterView, ReadingCheckView, ReadingLabels, ReadingRunView, ReadingView } from "./types"

export type {
    ReadingChapterView,
    ReadingCheckView,
    ReadingChunkView,
    ReadingLabels,
    ReadingRunView,
    ReadingTermView,
    ReadingVerdictView,
    ReadingView,
} from "./types"

/** The heading line a block starts with: the section above it already shows it as its title. */
const HEADING_LINE = /^\s*#{1,6}[^\r\n]*\r?\n/u

/** What a copyable block needs. */
type CopyBlockProps = {
    readonly code: string
    readonly language: string
    readonly label: string
    readonly copy: string
    readonly onCopy: (text: string) => void
}

/** A code block with its copy button. */
const CopyBlock = (props: CopyBlockProps) => (
    <FencedCodeBlock
        code={props.code}
        language={props.language}
        showLanguage={false}
        label={props.label}
        action={
            <Button variant="border" size="sm" onPress={() => props.onCopy(props.code)}>
                {props.copy}
            </Button>
        }
    />
)

/** What the Bản chất part needs. */
type EssentialReadingProps = {
    readonly view: ReadingView
    readonly labels: ReadingLabels
    readonly isLoading?: boolean
    /** At phone width the contents are one sticky chapter bar on top and a term opens its note in place. */
    readonly isPhone?: boolean
    readonly onCopy: (text: string) => void
    /** A pick of a self-check: the server grades it (`check.<id>`). */
    readonly onAnswer: (activityId: string, optionId: string) => void
}

/** The guards a `:::run` flow turns off (`guards="a,b"`), sorted, for comparing with a run. */
const guardsOf = (text: string | undefined): string =>
    (text ?? "")
        .split(",")
        .map((each) => each.trim())
        .filter((each) => each !== "")
        .sort()
        .join(",")

/** The mark of a run: the status glyph and its words. */
const runMarkOf = (run: ReadingRunView) => {
    const state = ({ passed: "done", failed: "error", running: "running" } as const)[run.state]
    return <InlineStatus state={state} label={run.stateLabel} />
}

/** What the learner's run under one flow needs. */
type YourRunProps = {
    readonly run: ReadingRunView | undefined
    /** The guards the flow turns off, sorted and joined. */
    readonly flowGuards: string
    readonly labels: ReadingLabels
}

/** Under a flow: the learner's newest relayed run of its scenario (state, when, guards, ledger), or the line before the first run. */
const YourRun = (props: YourRunProps) => {
    const { run, labels } = props
    return (
        <Stack gap="inline">
            <Text as="p" role="label.item">
                {labels.runYours}
            </Text>
            {run === undefined ? (
                <Text tone="muted">{labels.runNone}</Text>
            ) : (
                <Stack gap="inline">
                    <Cluster gap="inline" align="center">
                        {runMarkOf(run)}
                        <Text tone="muted">{run.caption}</Text>
                    </Cluster>
                    {[...run.guardsOff].sort().join(",") === props.flowGuards ? null : (
                        <Text tone="muted">{labels.runOtherGuards}</Text>
                    )}
                    {run.ledger === "" ? null : (
                        <FencedCodeBlock
                            code={run.ledger}
                            language="text"
                            showLanguage={false}
                            label={labels.runLedger}
                        />
                    )}
                </Stack>
            )}
        </Stack>
    )
}

/**
 * The drawing of a `:::run[label]{scenario="…" guards="…"}` flow: its command, the output recorded from a real run and its conclusion in
 * one card, the learner's own newest run of the same scenario under it.
 */
const runDrawingOf =
    (runs: ReadonlyArray<ReadingRunView>, labels: ReadingLabels): RichDrawing =>
    ({ node, inside }) => {
        const scenarioId = node.attrs["scenario"] ?? ""
        return (
            <SurfaceCard label={node.label === "" ? scenarioId : node.label} headingLevel={3}>
                <Stack gap="row">
                    {inside}
                    <YourRun
                        run={runs.find((run) => run.scenarioId === scenarioId)}
                        flowGuards={guardsOf(node.attrs["guards"])}
                        labels={labels}
                    />
                </Stack>
            </SurfaceCard>
        )
    }

/** What the lab panel needs. */
type LabPanelProps = {
    readonly lab: string
    readonly title: string
    readonly labels: ReadingLabels
    readonly onCopy: (text: string) => void
}

/** The lab panel: pull, start, try by hand and clean up, folded until the learner opens it. */
const LabPanel = (props: LabPanelProps) => (
    <Disclosure
        title={props.title}
        defaultExpanded={false}
        headingLevel={2}
        body={
            <RichMarkdown
                source={props.lab}
                labels={props.labels.markdown}
                measure="compact"
                onCopy={props.onCopy}
                renderCode={(code) => (
                    <LessonCode
                        code={code}
                        diagram={{ label: props.labels.diagram, errorTitle: props.labels.diagramError }}
                    />
                )}
            />
        }
    />
)

/** What the lesson's MCP card needs. */
type McpCardProps = {
    readonly view: ReadingView
    readonly labels: ReadingLabels
    readonly onCopy: (text: string) => void
}

/**
 * The lesson's MCP, compact: one line on what the learner's AI reads, the command to copy, and the client config folded under
 * "Chi tiết", so it never stands before the reading.
 */
const McpCard = (props: McpCardProps) => {
    const { view, labels } = props
    return (
        <Stack gap="inline">
            <Text as="p" role="label.item">
                {labels.mcpTitle}
            </Text>
            <Text tone="muted">{labels.mcpNote}</Text>
            <Cluster gap="inline" align="center">
                <Button variant="border" size="sm" onPress={() => props.onCopy(view.mcpCommand)}>
                    {labels.mcpCopy}
                </Button>
            </Cluster>
            <Disclosure
                kind="quiet"
                title={labels.mcpDetails}
                body={
                    <Stack gap="inline">
                        <CopyBlock
                            code={view.mcpConfig}
                            language="json"
                            label={labels.mcpConfig}
                            copy={labels.copy}
                            onCopy={props.onCopy}
                        />
                        <CopyBlock
                            code={view.mcpCommand}
                            language="bash"
                            label={labels.mcpCommand}
                            copy={labels.copy}
                            onCopy={props.onCopy}
                        />
                        <Text tone="muted">{labels.mcpToken}</Text>
                    </Stack>
                }
            />
        </Stack>
    )
}

/** Words with `inline code` marks: the marked runs drawn as Grammar's Code. */
const inlineCodeOf = (text: string): ReactNode =>
    text.split("`").map((part, index) => (index % 2 === 1 ? <Code key={index}>{part}</Code> : part))

/** The verdicts of a self-check as Grammar's GradedChoice reads them. */
const verdictsOf = (check: ReadingCheckView): Readonly<Record<string, GradedChoiceVerdict>> =>
    Object.fromEntries(
        Object.entries(check.verdicts).map(([id, verdict]) => [
            id,
            { state: verdict.state, explanation: inlineCodeOf(verdict.explanation) },
        ]),
    )

/**
 * The drawing of a `:::check{id="…"}` marker: the chapter's self-check, graded by the server one pick at a time (a wrong pick locks
 * with its reason, the right one releases every reason). The key never reaches the page before a pick.
 */
const checkDrawingOf =
    (checks: ReadingView["checks"], labels: ReadingLabels, onAnswer: EssentialReadingProps["onAnswer"]): RichDrawing =>
    ({ node }) => {
        const check = checks[node.attrs["id"] ?? ""]
        if (check === undefined) return null
        return (
            <Stack gap="row">
                <Text as="p" role="label.field">
                    {labels.checkTitle}
                </Text>
                <Text as="p" role="reading.body">
                    {inlineCodeOf(check.prompt)}
                </Text>
                <GradedChoice
                    grading="server"
                    label={labels.check.label}
                    options={check.options.map((option) => ({ id: option.id, label: inlineCodeOf(option.label) }))}
                    verdicts={verdictsOf(check)}
                    {...(check.pendingId === "" ? {} : { pendingId: check.pendingId })}
                    onPick={(optionId) => onAnswer(check.activityId, optionId)}
                    labels={labels.check}
                />
            </Stack>
        )
    }

/** What one chapter needs. */
type ChapterProps = {
    readonly chapter: ReadingChapterView
    readonly labels: ReadingLabels
    readonly drawings: Readonly<Record<string, RichDrawing>>
    readonly isLoading: boolean
    readonly onCopy: (text: string) => void
}

/**
 * One chapter: its heading, then its reading with the terms its prose uses explained in the margin (level with each dotted term on a
 * wide frame, opened in place under the term on a phone).
 */
const Chapter = (props: ChapterProps) => {
    const { chapter, labels } = props
    return (
        <Section
            id={chapter.id}
            title={chapter.title}
            headingLevel={2}
            {...(chapter.isFlagged ? { fact: labels.flagged } : {})}
            isLoading={props.isLoading}
        >
            <Sidenotes
                notes={chapter.terms.map((term) => ({ id: term.id, term: term.term, note: term.definition }))}
                title={labels.glossaryTitle}
                foldLabel={labels.glossaryFold}
                narrow="inline"
            >
                <RichMarkdown
                    source={chapter.markdown.replace(HEADING_LINE, "")}
                    labels={labels.markdown}
                    codeLabels={labels.code}
                    terms={chapter.terms.map((term) => ({ id: term.id, term: term.term }))}
                    isLoading={props.isLoading}
                    drawings={props.drawings}
                    onCopy={props.onCopy}
                    renderCode={(code) => (
                        <LessonCode code={code} diagram={{ label: labels.diagram, errorTitle: labels.diagramError }} />
                    )}
                />
            </Sidenotes>
        </Section>
    )
}

/**
 * Bản chất: the reading by chapter, each chapter a moment of the night. A sticky contents beside it follows the chapter in view (the
 * time of each moment before its title, the self-checks solved under the list); on a phone it is one sticky chapter bar on top. Each
 * chapter explains the terms its prose uses in the margin, runs its `:::run` flows with the learner's own newest run under each, and
 * closes with a server-graded self-check. The lesson's MCP and the lab are compact tools after the first chapter, never before the
 * reading.
 */
export const EssentialReading = (props: EssentialReadingProps): ReactElement => {
    const { view, labels } = props
    const isPhone = props.isPhone === true
    const isLoading = props.isLoading === true
    const checks = Object.values(view.checks)
    const solved = checks.filter((check) => check.isSolved).length
    const drawings = {
        run: runDrawingOf(view.runs, labels),
        check: checkDrawingOf(view.checks, labels, props.onAnswer),
    }
    const mcp = view.mcpConfig === "" ? null : <McpCard view={view} labels={labels} onCopy={props.onCopy} />
    const lab =
        view.lab === "" ? null : (
            <LabPanel
                lab={view.lab}
                title={isPhone ? labels.labLater : labels.labTitle}
                labels={labels}
                onCopy={props.onCopy}
            />
        )
    const tools = mcp === null && lab === null ? null : <Grid kind="pair" leading={mcp} trailing={lab} />
    const reading: ReactNode = (
        <Stack gap="region">
            {view.isLocked ? <Text tone="muted">{labels.locked}</Text> : null}
            {view.chapters.map((chapter, index) => (
                <Fragment key={chapter.id}>
                    <Chapter
                        chapter={chapter}
                        labels={labels}
                        drawings={drawings}
                        isLoading={isLoading}
                        onCopy={props.onCopy}
                    />
                    {index === 0 ? tools : null}
                </Fragment>
            ))}
            {view.chapters.length === 0 ? tools : null}
        </Stack>
    )
    if (view.chapters.length === 0) return reading
    const introCount = view.chapters.filter((chapter) => chapter.isIntro).length
    const contents = (
        <TableOfContents
            title={labels.tocTitle}
            kind={isPhone ? "bar" : "rail"}
            items={view.chapters.map((chapter) => ({
                id: chapter.id,
                label: chapter.isIntro && !isPhone ? `${labels.tocIntro}: ${chapter.label}` : chapter.label,
                ...(chapter.at === "" ? {} : { meta: chapter.at }),
            }))}
            note={checks.length === 0 ? "" : labels.checkSummary(solved, checks.length)}
            position={(index, total) =>
                view.chapters[index - 1]?.isIntro === true
                    ? labels.tocIntro
                    : labels.tocPosition(index - introCount, total - introCount)
            }
        />
    )
    if (isPhone)
        return (
            <Stack gap="section">
                {contents}
                {reading}
            </Stack>
        )
    return (
        <Grid
            kind="main-rail"
            primary={reading}
            rail={contents}
            railPosition="leading"
            railWidth="compact"
            align="stretch"
        />
    )
}
