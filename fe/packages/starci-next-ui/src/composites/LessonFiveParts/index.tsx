import {
    Alert,
    Badge,
    Button,
    Cluster,
    FencedCodeBlock,
    PaneSection,
    Section,
    Stack,
    Tabs,
    Terminal,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { LessonCode } from "../LessonCode"
import { RichMarkdown } from "../RichMarkdown"
import type {
    BugHuntLabels,
    BugHuntView,
    BugRowState,
    BugRowView,
    PatternLabels,
    PatternPartView,
    ReadingLabels,
    ReadingView,
} from "./types"

export type {
    BugHuntLabels,
    BugHuntView,
    BugRowState,
    BugRowView,
    PatternLabels,
    PatternPartView,
    PatternStackView,
    ReadingChunkView,
    ReadingLabels,
    ReadingTocRow,
    ReadingView,
} from "./types"

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
    return (
        <Stack gap="region">
            {view.isLocked ? <Text tone="muted">{labels.locked}</Text> : null}
            {view.chunks.map((chunk) => (
                <Section key={chunk.id} id={chunk.id} ariaLabel={chunk.title}>
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

/** The badge tone of a test state. */
const bugTone = (state: BugRowState) => {
    if (state === "passed") return "success" as const
    if (state === "failed") return "danger" as const
    if (state === "running") return "warning" as const
    return "muted" as const
}

/** What one test row needs. */
type BugRowProps = {
    readonly row: BugRowView
    readonly labels: BugHuntLabels
    readonly onHint: (testId: string) => void
}

/** One test: its state, the compared lines of a red run, why it is right or not yet, the opened hints and the next one. */
const BugRow = (props: BugRowProps) => {
    const { row, labels } = props
    return (
        <Section title={row.title} headingLevel={3} fact={row.caption}>
            <Stack gap="inline">
                <Cluster gap="identity">
                    <Badge tone={bugTone(row.state)}>{row.stateLabel}</Badge>
                </Cluster>
                {row.state === "locked" ? <Text tone="muted">{labels.lockedFinal}</Text> : null}
                {row.compare.length === 0 ? null : <Terminal label={row.title} lines={row.compare} />}
                {row.pass === "" ? null : <Alert tone="affirmative" title={labels.passTitle} description={row.pass} />}
                {row.fail === "" ? null : <Alert tone="negative" title={labels.failTitle} description={row.fail} />}
                {row.hints.length === 0 ? null : (
                    <Section
                        kind="list"
                        sublabel={labels.hintsTitle}
                        empty={labels.hintsTitle}
                        items={row.hints.map((hint) => ({ id: hint.id, title: hint.label, description: hint.text }))}
                    />
                )}
                {row.nextHint === "" ? null : (
                    <Cluster gap="inline">
                        <Button
                            intent="neutral"
                            size="sm"
                            isPending={row.isOpeningHint}
                            onPress={() => props.onHint(row.id)}
                        >
                            {row.nextHint}
                        </Button>
                    </Cluster>
                )}
            </Stack>
        </Section>
    )
}

/** What the Tìm sạn part needs. */
type EssentialBugHuntProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly isLoading?: boolean
    readonly onCopy: (text: string) => void
    readonly onHint: (testId: string) => void
}

/**
 * Tìm sạn: the commands that pull the buggy copy and run its tests on the learner's machine, then every test with the newest result
 * the relay brought back (the page polls while one runs). A green test says why it is right now; a red one compares what was expected
 * with what was received, says why it does not pass yet and opens its hints one at a time. The final test waits for the others.
 */
export const EssentialBugHunt = (props: EssentialBugHuntProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Section title={labels.pullTitle} headingLevel={2} isLoading={isLoading}>
                <Stack gap="inline">
                    {view.machine === "" ? (
                        <Alert tone="cautionary" title={labels.machineNone} description={labels.machineNoneNote} />
                    ) : (
                        <Cluster gap="inline">
                            <Badge isDot tone="success">
                                {labels.machineOnline(view.machine)}
                            </Badge>
                        </Cluster>
                    )}
                    <Text tone="muted">{labels.pullNote}</Text>
                    <CopyBlock
                        code={view.commands}
                        language="bash"
                        label={labels.pullTitle}
                        copy={labels.copy}
                        onCopy={props.onCopy}
                    />
                </Stack>
            </Section>
            <Section title={view.runTitle} headingLevel={2} isLoading={isLoading}>
                <Stack gap="section">
                    {view.rows.length === 0 ? <Text tone="muted">{labels.runsEmpty}</Text> : null}
                    {view.rows.map((row) => (
                        <BugRow key={row.id} row={row} labels={labels} onHint={props.onHint} />
                    ))}
                </Stack>
            </Section>
        </Stack>
    )
}

/** The list state of a test in the right column. */
const asideState = (state: BugRowState) => {
    if (state === "passed") return "affirmative" as const
    if (state === "failed") return "negative" as const
    return "neutral" as const
}

/** What the right column of Tìm sạn needs. */
type EssentialBugHuntAsideProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly journey: ReactNode
}

/** The right column of Tìm sạn: the five bugs by essence, how hints open, what unlocks Challenges, then the parts. */
export const EssentialBugHuntAside = (props: EssentialBugHuntAsideProps) => (
    <>
        <AsideBlock
            title={props.labels.asideBugs}
            isFirst
            content={
                <Section
                    kind="list"
                    ariaLabel={props.labels.asideBugs}
                    empty={props.labels.runsEmpty}
                    items={props.view.bugs.map((bug, index) => ({
                        id: bug.id,
                        title: `${index + 1} · ${bug.title}`,
                        state: asideState(bug.state),
                    }))}
                />
            }
        />
        <AsideBlock
            title={props.labels.asideHintsTitle}
            isFirst={false}
            content={<Text tone="muted">{props.labels.asideHints}</Text>}
        />
        <AsideBlock
            title={props.labels.asideUnlockTitle}
            isFirst={false}
            content={
                <Text tone="muted">
                    {props.view.isChallengesLocked ? props.labels.asideUnlock : props.labels.asideUnlocked}
                </Text>
            }
        />
        {props.journey}
    </>
)

/** One tab of the stack switch. */
type StackTab = { readonly id: string; readonly label: string }

/** The two to four tabs the given slots hold, in order. */
const tabsOf = (a: StackTab, b: StackTab, c: StackTab | undefined, d: StackTab | undefined) => {
    if (c === undefined) return [a, b] as const
    return d === undefined ? ([a, b, c] as const) : ([a, b, c, d] as const)
}

/** What the Pattern part needs. */
type EssentialPatternProps = {
    readonly part: PatternPartView
    readonly labels: PatternLabels
    readonly isLoading?: boolean
    readonly onSelect: (stack: string) => void
}

/** The stack switch: tabs over two to four stacks, a badge for a single one. */
const StackSwitch = (props: EssentialPatternProps) => {
    const items = props.part.stacks.map((stack) => ({ id: stack.id, label: stack.label }))
    const [a, b, c, d] = items
    if (a === undefined) return null
    if (b === undefined)
        return (
            <Cluster gap="identity">
                <Badge tone="neutral">{a.label}</Badge>
            </Cluster>
        )
    return (
        <Tabs
            appearance="primary"
            label={props.labels.stacks}
            items={tabsOf(a, b, c, d)}
            selectedKey={props.part.selected}
            onSelect={props.onSelect}
        />
    )
}

/**
 * Pattern: where a real project keeps the pattern, per stack. The three questions an AI does not answer by itself, the business code
 * that only declares the event, the main files of the platform folder and the way to the repository. A stack that is coming says so.
 * Not graded.
 */
export const EssentialPattern = (props: EssentialPatternProps) => {
    const { part, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <StackSwitch {...props} />
            {part.answers.length === 0 ? (
                <Text tone="muted">{labels.soon}</Text>
            ) : (
                <Section
                    kind="list"
                    title={labels.questions}
                    headingLevel={2}
                    isLoading={isLoading}
                    empty={labels.soon}
                    items={part.answers.map((answer) => ({
                        id: answer.id,
                        title: answer.title,
                        description: answer.text,
                    }))}
                />
            )}
            {part.snippet === undefined ? null : (
                <Section title={labels.snippet} headingLevel={2} isLoading={isLoading}>
                    <FencedCodeBlock code={part.snippet.code} language={part.snippet.lang} label={part.snippet.file} />
                </Section>
            )}
            {part.files.length === 0 ? null : (
                <Section
                    kind="list"
                    title={labels.files(part.folder)}
                    headingLevel={2}
                    isLoading={isLoading}
                    empty={labels.filesEmpty}
                    items={part.files.map((file) => ({ id: file.id, title: file.path, description: file.note }))}
                />
            )}
        </Stack>
    )
}

/** The primary of Pattern: the folder on GitHub; nothing for a stack without one. */
export const EssentialPatternLink = (props: { readonly href: string; readonly label: string }) =>
    props.href === "" ? null : (
        <Button intent="neutral" href={props.href}>
            {props.label}
        </Button>
    )

/** What the right column of Pattern needs. */
type EssentialPatternAsideProps = {
    readonly part: PatternPartView
    readonly labels: PatternLabels
    readonly journey: ReactNode
}

/** The right column of Pattern: where the code comes from, how a stack is added, then the parts. */
export const EssentialPatternAside = (props: EssentialPatternAsideProps) => (
    <>
        <AsideBlock
            title={props.labels.sourceTitle}
            isFirst
            content={<Text tone="muted">{props.labels.sourceNote(props.part.repo)}</Text>}
        />
        <AsideBlock
            title={props.labels.addTitle}
            isFirst={false}
            content={<Text tone="muted">{props.labels.addNote}</Text>}
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
