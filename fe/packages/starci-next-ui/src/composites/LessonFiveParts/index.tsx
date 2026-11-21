import {
    Badge,
    Button,
    Disclosure,
    FencedCodeBlock,
    Grid,
    PaneSection,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { LessonCode } from "../LessonCode"
import { RichMarkdown } from "../RichMarkdown"
import type { ReadingLabels, ReadingView } from "./types"

export type { ReadingChunkView, ReadingLabels, ReadingTocRow, ReadingView } from "./types"

/** One block of a right column: its name then its content, set off from the one above by a hairline. */
type AsideBlockProps = { readonly title: string; readonly isFirst: boolean; readonly content: ReactNode }

/** One block of a right column. */
const AsideBlock = (props: AsideBlockProps) => (
    <PaneSection {...(props.isFirst ? {} : { rule: "start" as const })}>
        <Text as="p" isStrong>
            {props.title}
        </Text>
        {props.content}
    </PaneSection>
)

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
            <Button intent="neutral" size="sm" onPress={() => props.onCopy(props.code)}>
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
 * Bản chất: the practice-led reading of the lesson, one landmark per heading so the contents can link to it, then the config of the
 * lesson's own MCP (the AI reads the lesson, its source and the learner's runs, never the hidden answers).
 */
export const EssentialReading = (props: EssentialReadingProps) => {
    const { view, labels } = props
    const flaggedIds = new Set(view.toc.filter((row) => row.isFlagged).map((row) => row.id))
    return (
        <Stack gap="region">
            {view.isLocked ? <Text tone="muted">{labels.locked}</Text> : null}
            {view.chunks.length === 0 ? null : (
                <Section title={labels.overviewTitle} headingLevel={2}>
                    <Grid kind="cards" columns="balanced" gap="inline" size="tile">
                        {view.chunks.map((chunk, index) => (
                            <SurfaceCard
                                key={chunk.id}
                                ariaLabel={chunk.title}
                                wholeAction={{ kind: "link", href: `#${chunk.id}`, label: chunk.title }}
                            >
                                <Stack gap="inline">
                                    <Badge tone={flaggedIds.has(chunk.id) ? "warning" : "accent"}>
                                        {String(index + 1)}
                                    </Badge>
                                    <Text as="p" isStrong>
                                        {chunk.title}
                                    </Text>
                                    {flaggedIds.has(chunk.id) ? <Text tone="muted">{labels.flagged}</Text> : null}
                                </Stack>
                            </SurfaceCard>
                        ))}
                    </Grid>
                </Section>
            )}
            {view.chunks.length === 0 ? null : (
                <Section title={labels.deepTitle} headingLevel={2}>
                    <Stack gap="inline">
                        {view.chunks.map((chunk, index) => (
                            <Section key={chunk.id} id={chunk.id} ariaLabel={chunk.title}>
                                <Disclosure
                                    title={chunk.title}
                                    headingLevel={3}
                                    leading={{
                                        state: flaggedIds.has(chunk.id) ? "problem" : "todo",
                                        position: index + 1,
                                    }}
                                    defaultExpanded={flaggedIds.has(chunk.id)}
                                    {...(flaggedIds.has(chunk.id) ? { summary: labels.flagged } : {})}
                                    body={
                                        <RichMarkdown
                                            source={chunk.markdown}
                                            labels={labels.markdown}
                                            isLoading={props.isLoading === true}
                                            renderCode={(code) => <LessonCode code={code} />}
                                        />
                                    }
                                />
                            </Section>
                        ))}
                    </Stack>
                </Section>
            )}
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

/** What the right column of Bản chất needs. */
type EssentialReadingAsideProps = {
    readonly view: ReadingView
    readonly labels: ReadingLabels
    /** The five parts of the lesson, the block the other parts' columns end with. */
    readonly journey: ReactNode
}

/** The right column of Bản chất: the contents, "Nên đọc kỹ" on the headings a missed opener question points at, then the parts. */
export const EssentialReadingAside = (props: EssentialReadingAsideProps) => (
    <>
        <AsideBlock
            title={props.labels.tocTitle}
            isFirst
            content={
                <Section
                    kind="list"
                    ariaLabel={props.labels.tocTitle}
                    empty={props.labels.tocEmpty}
                    items={props.view.toc.map((row) => ({
                        id: row.id,
                        title: row.title,
                        href: row.href,
                        ...(row.isFlagged
                            ? { badges: [{ label: props.labels.flagged, tone: "warning" as const }] as const }
                            : {}),
                    }))}
                />
            }
        />
        {props.journey}
    </>
)

/** What the journey block needs: the five parts with where the learner stands in each. */
type LessonJourneyBlockProps = {
    readonly title: string
    readonly rows: ReadonlyArray<{
        readonly id: string
        readonly title: string
        readonly isDone: boolean
        readonly isLocked: boolean
    }>
}

/** The last block of a right column: "Bài này gồm 5 phần", each part done, open or locked. */
export const LessonJourneyBlock = (props: LessonJourneyBlockProps) => (
    <AsideBlock
        title={props.title}
        isFirst={false}
        content={
            <Section
                kind="list"
                ariaLabel={props.title}
                empty={props.title}
                items={props.rows.map((row, index) => {
                    const state = row.isLocked ? "unavailable" : row.isDone ? "affirmative" : "neutral"
                    return { id: row.id, title: `${index + 1} · ${row.title}`, state: state as "neutral" }
                })}
            />
        }
    />
)
