import {
    Button,
    Cluster,
    Disclosure,
    FencedCodeBlock,
    Grid,
    InlineStatus,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { LessonCode } from "../LessonCode"
import { RichMarkdown, type RichDrawing } from "../RichMarkdown"
import type { ReadingLabels, ReadingRunView, ReadingView } from "./types"

export type { ReadingChunkView, ReadingLabels, ReadingRunView, ReadingTocRow, ReadingView } from "./types"

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
    /** At phone width the lab panel is a folded "run it on a computer later" note above the reading, never a side column. */
    readonly isPhone?: boolean
    readonly onCopy: (text: string) => void
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

/** What the MCP card needs. */
type McpCardProps = {
    readonly view: ReadingView
    readonly labels: ReadingLabels
    readonly onCopy: (text: string) => void
}

/** The card of the lesson's MCP: the client config and the Claude Code command, so the AI reads the lesson, its source and the learner's runs. */
const McpCard = (props: McpCardProps) => {
    const { view, labels } = props
    return (
        <SurfaceCard label={labels.mcpTitle} headingLevel={2}>
            <Stack gap="inline">
                <Text tone="muted">{labels.mcpNote}</Text>
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
        </SurfaceCard>
    )
}

/**
 * Bản chất: the lesson's MCP card on top, the contents (the headings a missed opener question points at carry "Nên đọc kỹ"), then the
 * scenario-led reading, one landmark per heading so the contents can link to it. Every `:::run` flow carries the learner's own newest run
 * the relay brought back. The `:::lab` block (pull, start, clean up) is a folded panel in the right column on a wide screen and a folded
 * "run it on a computer later" note above the reading on a phone, never inline between explanations.
 */
export const EssentialReading = (props: EssentialReadingProps) => {
    const { view, labels } = props
    const flaggedIds = new Set(view.toc.filter((row) => row.isFlagged).map((row) => row.id))
    const drawings = { run: runDrawingOf(view.runs, labels) }
    const reading: ReactNode = (
        <Stack gap="region">
            {view.isLocked ? <Text tone="muted">{labels.locked}</Text> : null}
            {view.mcpConfig === "" ? null : <McpCard view={view} labels={labels} onCopy={props.onCopy} />}
            {props.isPhone === true && view.lab !== "" ? (
                <LabPanel lab={view.lab} title={labels.labLater} labels={labels} onCopy={props.onCopy} />
            ) : null}
            {view.chunks.length === 0 ? null : (
                <Disclosure
                    kind="quiet"
                    title={labels.tocTitle}
                    body={
                        <Section
                            kind="list"
                            ariaLabel={labels.tocTitle}
                            isLoading={props.isLoading === true}
                            empty={labels.tocEmpty}
                            items={view.toc.map((row) => ({
                                id: row.id,
                                title: row.title,
                                href: row.href,
                                ...(row.isFlagged
                                    ? { badges: [{ label: labels.flagged, tone: "warning" as const }] as const }
                                    : {}),
                            }))}
                        />
                    }
                />
            )}
            {view.chunks.map((chunk) => (
                <Section
                    key={chunk.id}
                    id={chunk.id}
                    title={chunk.title}
                    headingLevel={2}
                    {...(flaggedIds.has(chunk.id) ? { fact: labels.flagged } : {})}
                    isLoading={props.isLoading === true}
                >
                    <RichMarkdown
                        source={chunk.markdown.replace(HEADING_LINE, "")}
                        labels={labels.markdown}
                        isLoading={props.isLoading === true}
                        drawings={drawings}
                        onCopy={props.onCopy}
                        renderCode={(code) => (
                            <LessonCode
                                code={code}
                                diagram={{ label: props.labels.diagram, errorTitle: props.labels.diagramError }}
                            />
                        )}
                    />
                </Section>
            ))}
        </Stack>
    )
    // TODO(grammar reading roles): adopt Grammar's TableOfContents, CodeBlock, Mermaid tones, GradedChoice (the self-checks) and
    // Sidenote once @starci/grammar publishes them to the local registry; 0.55.1-dev.6 (the newest there on 2026-11-23) has none of them.
    if (props.isPhone === true || view.lab === "") return reading
    return (
        <Grid
            kind="main-rail"
            primary={reading}
            rail={<LabPanel lab={view.lab} title={labels.labTitle} labels={labels} onCopy={props.onCopy} />}
            railWidth="standard"
            align="start"
        />
    )
}
