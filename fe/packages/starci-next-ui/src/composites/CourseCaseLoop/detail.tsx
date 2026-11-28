import { Button, Cluster, CopyField, IconTile, Stack, Text } from "@starci/grammar/common"
import { InterviewerQuote, NarrationText, narrationTermsOf, type NarrationTerm } from "../Narration"
import type {
    CourseCaseDetailView,
    CourseCaseLoopLabels,
    CourseCommandView,
    CourseCopyLabels,
    CourseHintLevelView,
    CourseInvariantView,
} from "./types"

/** What one command line needs. */
type CommandLineProps = {
    readonly command: CourseCommandView
    readonly copy: CourseCopyLabels
}

/** A command the learner types: its title, what it does and the line to copy. */
export const CommandLine = (props: CommandLineProps) => (
    <Stack gap="inline">
        <Text as="p" role="label.item">
            {props.command.title}
        </Text>
        {props.command.note === "" ? null : <Text tone="muted">{props.command.note}</Text>}
        <CopyField
            label={props.command.title}
            isLabelHidden
            value={props.command.command}
            copyLabel={props.copy.copy}
            copiedLabel={props.copy.copied}
            copyErrorLabel={props.copy.copyFailed}
        />
    </Stack>
)

/** What a titled fact needs: its name and the lines it says, one per line. */
type FactProps = {
    readonly title: string
    readonly lines: ReadonlyArray<string>
}

/** One fact of a case: its muted name over the lines it says. */
const Fact = (props: FactProps) => (
    <Stack gap="identity">
        <Text as="p" role="caption" tone="muted">
            {props.title}
        </Text>
        {props.lines.map((line) => (
            <Text key={line} as="p">
                {line}
            </Text>
        ))}
    </Stack>
)

/**
 * What a case checks, one line each, lit by the last run. Each line leads with a Grammar `IconTile` status mark (lessons.md §7: a ticked
 * list never draws a bare glyph): held is the green done plate with its check, broken the red error plate with its x, not run yet the
 * grey ring. The mark carries the state, so the line itself is only the check; the state's words are the mark's accessible name.
 */
const Checks = (props: { readonly title: string; readonly empty: string; readonly checks: ReadonlyArray<CourseInvariantView> }) => (
    <Stack gap="identity">
        <Text as="p" role="caption" tone="muted">
            {props.title}
        </Text>
        {props.checks.length === 0 ? (
            <Text as="p">{props.empty}</Text>
        ) : (
            props.checks.map((check) => (
                <Cluster key={check.text} gap="inline" align="center" wrap={false}>
                    <IconTile state={check.state} ariaLabel={check.stateLabel} />
                    <Text>{check.text}</Text>
                </Cluster>
            ))
        )}
    </Stack>
)

/** What the hint ladder needs. */
type HintLadderProps = {
    readonly levels: ReadonlyArray<CourseHintLevelView>
    /** The keywords each opened level marks, by level (the case is one section). */
    readonly marks: ReadonlyMap<number, ReadonlyArray<NarrationTerm>>
    readonly labels: CourseCaseLoopLabels
    readonly onOpen: (level: number) => void
}

/** The hint ladder: the opened levels in words, then the one button that opens the next level. */
const HintLadder = (props: HintLadderProps) => {
    const next = props.levels.find((each) => each.isNext)
    return (
        <Stack gap="inline">
            <Text as="p" role="caption" tone="muted">
                {props.labels.hintsTitle}
            </Text>
            {props.levels
                .filter((each) => each.isOpen)
                .map((each) => (
                    <Text key={each.level} as="p">
                        <Text as="span" isStrong>
                            {`${each.title}. `}
                        </Text>
                        <NarrationText text={each.text} terms={props.marks.get(each.level) ?? []} />
                    </Text>
                ))}
            {next === undefined ? null : (
                <Stack gap="identity" align="start">
                    <Button
                        variant="border"
                        size="sm"
                        isPending={next.isOpening}
                        onPress={() => props.onOpen(next.level)}
                    >
                        {props.labels.openHint(next.level)}
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}

/** What the detail of one case needs. */
type CaseDetailProps = {
    readonly detail: CourseCaseDetailView
    readonly labels: CourseCaseLoopLabels
    readonly onHint: (caseId: string, level: number) => void
}

/**
 * The case on screen under its row: a locked case says when it opens; an open one shows the interviewer's question it answers, the chaos it
 * runs under, what must hold, the command that runs it, the hint ladder, the diff once green and the way back to the reference step. What
 * broke in the last run is read in the lab panel beside the loop, not repeated here.
 */
export const CaseDetail = (props: CaseDetailProps) => {
    const { detail, labels } = props
    if (detail.lockedNote !== "") return <Text tone="muted">{detail.lockedNote}</Text>
    // The case is one section of narration: its situation, then its opened hints, each keyword marked where it first stands.
    const opened = (detail.hints ?? []).filter((each) => each.isOpen)
    const [situation, ...hintMarks] = narrationTermsOf(
        [detail.situation, ...opened.map((each) => each.text)],
        detail.terms,
    )
    const marks = new Map(opened.map((each, index) => [each.level, hintMarks[index] ?? []] as const))
    return (
        <Stack gap="section">
            {detail.question === "" ? null : <InterviewerQuote quote={detail.question} />}
            {detail.situation === "" ? null : (
                <Text as="p" role="reading.body">
                    <NarrationText text={detail.situation} terms={situation ?? []} />
                </Text>
            )}
            <Fact title={labels.chaosTitle} lines={detail.chaos.length === 0 ? [labels.noChaos] : detail.chaos} />
            <Checks title={labels.invariantsTitle} empty={labels.noInvariants} checks={detail.invariants} />
            {detail.run === undefined ? null : <CommandLine command={detail.run} copy={labels.copy} />}
            {detail.hints === undefined ? null : (
                <HintLadder
                    levels={detail.hints}
                    marks={marks}
                    labels={labels}
                    onOpen={(level) => props.onHint(detail.id, level)}
                />
            )}
            {detail.diff === undefined ? null : <CommandLine command={detail.diff} copy={labels.copy} />}
            {detail.reset === undefined ? null : (
                <Stack gap="inline">
                    <CommandLine command={detail.reset.command} copy={labels.copy} />
                    <Text tone="muted">{detail.reset.warning}</Text>
                </Stack>
            )}
        </Stack>
    )
}
