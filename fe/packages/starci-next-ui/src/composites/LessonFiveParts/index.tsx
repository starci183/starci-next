import { Button, FencedCodeBlock, Section, Stack, Text } from "@starci/grammar/common"
import { LessonCode } from "../LessonCode"
import { RichMarkdown } from "../RichMarkdown"
import type { ReadingLabels, ReadingView } from "./types"

export type { ReadingChunkView, ReadingLabels, ReadingTocRow, ReadingView } from "./types"

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
    readonly onCopy: (text: string) => void
}

/**
 * Bản chất: the contents (the headings a missed opener question points at carry "Nên đọc kỹ"), then the practice-led reading, one
 * landmark per heading so the contents can link to it, then the config of the lesson's own MCP (the AI reads the lesson, its source and
 * the learner's runs, never the hidden answers).
 */
export const EssentialReading = (props: EssentialReadingProps) => {
    const { view, labels } = props
    const flaggedIds = new Set(view.toc.filter((row) => row.isFlagged).map((row) => row.id))
    return (
        <Stack gap="region">
            {view.isLocked ? <Text tone="muted">{labels.locked}</Text> : null}
            {view.chunks.length === 0 ? null : (
                <Section
                    kind="list"
                    title={labels.tocTitle}
                    headingLevel={2}
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
                        source={chunk.markdown}
                        labels={labels.markdown}
                        isLoading={props.isLoading === true}
                        renderCode={(code) => <LessonCode code={code} />}
                    />
                </Section>
            ))}
            {view.mcpConfig === "" ? null : (
                <Section title={labels.mcpTitle} headingLevel={2} id="lesson-mcp">
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
                </Section>
            )}
        </Stack>
    )
}
