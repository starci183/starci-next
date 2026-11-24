import { Button, CopyField, Stack, Text } from "@starci/grammar/common"
import type {
    CourseCaseDetailView,
    CourseCaseLoopLabels,
    CourseCommandView,
    CourseCopyLabels,
    CourseHintLevelView,
    CourseViolationView,
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

/** What a titled fact needs: its name and the words it says. */
type FactProps = {
    readonly title: string
    readonly text: string
}

/** One fact of a case: its name over the words it says. */
const Fact = (props: FactProps) => (
    <Stack gap="identity">
        <Text as="p" role="label.item">
            {props.title}
        </Text>
        <Text as="p">{props.text}</Text>
    </Stack>
)

/** What the hint ladder needs. */
type HintLadderProps = {
    readonly levels: ReadonlyArray<CourseHintLevelView>
    readonly labels: CourseCaseLoopLabels
    readonly onOpen: (level: number) => void
}

/** The hint ladder: the opened levels in words, then the one button that opens the next level. */
const HintLadder = (props: HintLadderProps) => {
    const next = props.levels.find((each) => each.isNext)
    return (
        <Stack gap="inline">
            <Text as="p" role="label.item">
                {props.labels.hintsTitle}
            </Text>
            <Text tone="muted">{props.labels.hintsNote}</Text>
            {props.levels
                .filter((each) => each.isOpen)
                .map((each) => (
                    <Text key={each.level} as="p">
                        <Text as="span" role="label.item">
                            {`${each.title}. `}
                        </Text>
                        {each.text}
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

/** What the broken invariant of a red case needs. */
type ViolationProps = {
    readonly violation: CourseViolationView
    readonly labels: CourseCaseLoopLabels
}

/** The invariant a red case broke, in words, with what was expected and what was found. */
const Violation = (props: ViolationProps) => {
    const { violation, labels } = props
    const hasValues = violation.expected !== "" || violation.actual !== ""
    return (
        <Stack gap="inline">
            <Fact
                title={labels.violationTitle}
                text={violation.invariant === "" ? violation.message : `${violation.invariant} ${violation.message}`}
            />
            {hasValues ? (
                <Stack gap="identity">
                    <Text as="p">{`${labels.expected}: ${violation.expected}`}</Text>
                    <Text as="p">{`${labels.actual}: ${violation.actual}`}</Text>
                </Stack>
            ) : null}
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
 * The case on screen under its row: a locked case says when it opens; an open one shows what it keeps and the chaos it runs under, the
 * command that runs it, the invariant it broke when red, the hint ladder, the diff once green and the way back to the reference step.
 */
export const CaseDetail = (props: CaseDetailProps) => {
    const { detail, labels } = props
    if (detail.lockedNote !== "") return <Text tone="muted">{detail.lockedNote}</Text>
    return (
        <Stack gap="section">
            <Fact
                title={labels.invariantsTitle}
                text={detail.invariants.length === 0 ? labels.noInvariants : detail.invariants.join(" ")}
            />
            <Fact
                title={labels.chaosTitle}
                text={detail.chaos.length === 0 ? labels.noChaos : detail.chaos.join(" ")}
            />
            {detail.run === undefined ? null : <CommandLine command={detail.run} copy={labels.copy} />}
            {detail.violation === undefined ? null : <Violation violation={detail.violation} labels={labels} />}
            {detail.hints === undefined ? null : (
                <HintLadder levels={detail.hints} labels={labels} onOpen={(level) => props.onHint(detail.id, level)} />
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
