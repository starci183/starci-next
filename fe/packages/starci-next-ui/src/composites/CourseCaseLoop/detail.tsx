import { Button, Cluster, CopyField, Disclosure, Grid, IconTile, Quote, Stack, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { ITEM_TILE } from "../../leaves/Icon"
import { InterviewerQuote, NarrationText, narrationPlainOf, narrationTermsOf, type NarrationTerm } from "../Narration"
import type {
    CourseBeforeAfterLabels,
    CourseCaseBeforeAfterView,
    CourseCaseSideView,
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

/**
 * What a case checks, one line each, lit by the last run. Each line leads with a Grammar `IconTile` status mark (lessons.md §7: a ticked
 * list never draws a bare glyph): held is the green done plate with its check, broken the red error plate with its x, not run yet the
 * grey ring. The mark carries the state, so the line itself is only the check; the state's words are the mark's accessible name.
 */
const Checks = (props: { readonly empty: string; readonly checks: ReadonlyArray<CourseInvariantView> }) => (
    <Stack gap="identity">
        {props.checks.length === 0 ? (
            <Text as="p">{props.empty}</Text>
        ) : (
            props.checks.map((check) => (
                <Cluster key={check.text} gap="inline" align="center" wrap={false}>
                    {/* A line of the list's content: the round 24 (a header's tile stays 40). */}
                    <IconTile state={check.state} ariaLabel={check.stateLabel} {...ITEM_TILE} />
                    {/* The record writes a condition with marks (`confirmed`): drawn as narration, never raw backticks. */}
                    <Text>
                        <NarrationText text={check.text} terms={[]} />
                    </Text>
                </Cluster>
            ))
        )}
    </Stack>
)

/** What one numbered part of a case needs: its number, its title, where it stands, and what it holds. */
type PartProps = {
    readonly n: number
    readonly title: string
    readonly state: "notRun" | "waiting" | "done"
    readonly children: ReactNode
}

/**
 * One part of a case (owner 2026-11-28: Tình huống, Điều kiện, Kiểm tra): Grammar's round mark with the part's number (its tick once the
 * case is green), the title beside it, and what it holds under the title in the same column.
 */
const Part = (props: PartProps) => (
    <Cluster gap="row" align="start" wrap={false}>
        {/* A part of the case sits under the case's own row (40): one size down, the round 20 (owner 2026-11-28: "ô trong phải nhỏ hơn"). */}
        {props.state === "done" ? (
            <IconTile state="done" {...ITEM_TILE} />
        ) : (
            // The number as Grammar's step tile at 20 (its numeral at the caption size, readable), amber for the part the learner is on.
            <IconTile step={props.n} tone={props.state === "waiting" ? "warning" : "neutral"} {...ITEM_TILE} />
        )}
        <Stack gap="inline">
            <Text as="p" role="label.item">
                {props.title}
            </Text>
            {props.children}
        </Stack>
    </Cluster>
)

/**
 * The steps of one side of a case, one line each: Grammar's round 20 step tile with the step's number (the tone of the side: danger before
 * the fix, success after it) and the step's words, drawn as narration so `code` and **service** read as marks, never raw.
 */
const SideSteps = (props: { readonly steps: ReadonlyArray<string>; readonly tone: "danger" | "success" }) => (
    <Stack gap="identity">
        {props.steps.map((step, index) => (
            <Cluster key={`${String(index)}-${step}`} gap="inline" align="start" wrap={false}>
                <IconTile step={index + 1} tone={props.tone} {...ITEM_TILE} />
                <Text>
                    <NarrationText text={step} terms={[]} />
                </Text>
            </Cluster>
        ))}
    </Stack>
)

/** One labelled line of a side ("Kết quả: …"): the label as the item label, the words as narration. */
const SideLine = (props: { readonly label: string; readonly text: string }) =>
    props.text === "" ? null : (
        <Text as="p">
            {`${props.label}: `}
            <NarrationText text={props.text} terms={[]} />
        </Text>
    )

/** What one column of the before-and-after comparison needs. */
type SideColumnProps = {
    readonly title: string
    readonly side: CourseCaseSideView
    readonly isAfter: boolean
    readonly labels: CourseBeforeAfterLabels
}

/**
 * One column of the comparison: its title led by Grammar's round 20 state mark (the red error plate before the fix, the green done plate
 * after it), the numbered steps in the same tone, then the result and, after the fix, what it gains (what it costs is told above, in
 * "Chưa sửa thì hỏng").
 */
const SideColumn = (props: SideColumnProps) => (
    <Stack gap="inline">
        <Cluster gap="inline" align="center" wrap={false}>
            <IconTile state={props.isAfter ? "done" : "error"} {...ITEM_TILE} />
            <Text as="p" role="label.item">
                {props.title}
            </Text>
        </Cluster>
        <SideSteps steps={props.side.steps} tone={props.isAfter ? "success" : "danger"} />
        <SideLine label={props.labels.resultLabel} text={props.side.result} />
        {props.isAfter ? <SideLine label={props.labels.gainLabel} text={props.side.outcome} /> : null}
    </Stack>
)

/**
 * What "Sửa thế nào" holds once the case is revealed (green once, or the solution opened): how the fix goes, the system before and after
 * it side by side (Grammar's pair grid, stacked on a narrow screen), and the idea the case proves as Grammar's quote block, its words plain.
 * Until then the one muted line that says when it opens.
 */
const FixBody = (props: { readonly view: CourseCaseBeforeAfterView; readonly labels: CourseBeforeAfterLabels }) => {
    const { view, labels } = props
    if (view.after === undefined) return <Text tone="muted">{labels.fixLocked}</Text>
    return (
        <Stack gap="row">
            {view.fix === "" ? null : (
                <Text as="p" role="reading.body">
                    <NarrationText text={view.fix} terms={[]} />
                </Text>
            )}
            <Grid
                kind="pair"
                leading={<SideColumn title={labels.beforeTitle} side={view.before} isAfter={false} labels={labels} />}
                trailing={<SideColumn title={labels.afterTitle} side={view.after} isAfter labels={labels} />}
            />
            {view.idea === "" ? null : <Quote variant="block" source={labels.ideaTitle} text={narrationPlainOf(view.idea)} />}
        </Stack>
    )
}

/** What the hint ladder needs. */
type HintLadderProps = {
    readonly levels: ReadonlyArray<CourseHintLevelView>
    /** The keywords each opened level marks, by level (the case is one section). */
    readonly marks: ReadonlyMap<number, ReadonlyArray<NarrationTerm>>
    readonly labels: CourseCaseLoopLabels
    readonly onOpen: (level: number) => void
}

/** The hint ladder: each opened level a disclosure (open by default), then the one button that opens the next level. */
const HintLadder = (props: HintLadderProps) => {
    const next = props.levels.find((each) => each.isNext)
    return (
        <Stack gap="inline">
            {props.levels
                .filter((each) => each.isOpen)
                .map((each) => (
                    <Disclosure
                        key={each.level}
                        kind="quiet"
                        headingLevel={4}
                        defaultExpanded
                        title={each.title}
                        body={
                            <Text as="p">
                                <NarrationText text={each.text} terms={props.marks.get(each.level) ?? []} />
                            </Text>
                        }
                    />
                ))}
            {next === undefined ? null : (
                <Stack gap="identity" align="start">
                    <Button variant="border" size="sm" isPending={next.isOpening} onPress={() => props.onOpen(next.level)}>
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
    readonly onSolution?: ((caseId: string) => void) | undefined
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
    const checkState = detail.status === "green" ? ("done" as const) : ("waiting" as const)
    const beforeAfter = detail.beforeAfter
    // The parts are numbered in the order they stand: a case with a before-and-after block has two more (owner 2026-11-28).
    const extra = beforeAfter === undefined ? 0 : 1
    return (
        <Stack gap="section">
            {/* A case reads like a happy one (owner 2026-11-28: "ghép mặt thầy vào làm gì? làm như happy path"): no mentor head; the
                question the case answers opens its situation as a quote. */}
            <Part n={1} title={beforeAfter === undefined ? labels.situationTitle : labels.beforeAfter.storyTitle} state="notRun">
                {detail.question === "" ? null : <InterviewerQuote quote={detail.question} />}
                {detail.situation === "" ? null : (
                    <Text as="p" role="reading.body">
                        <NarrationText text={detail.situation} terms={situation ?? []} />
                    </Text>
                )}
                <Text as="p" role="caption" tone="muted">
                    {`${labels.chaosTitle}: ${detail.chaos.length === 0 ? labels.noChaos : detail.chaos.join(" · ")}`}
                </Text>
            </Part>
            {beforeAfter === undefined ? null : (
                <Part n={2} title={labels.beforeAfter.brokenTitle} state="notRun">
                    <SideSteps steps={beforeAfter.before.steps} tone="danger" />
                    {beforeAfter.before.outcome === "" ? null : (
                        <Text as="p" role="reading.body">
                            <NarrationText text={beforeAfter.before.outcome} terms={[]} />
                        </Text>
                    )}
                </Part>
            )}
            <Part n={2 + extra} title={labels.invariantsTitle} state="notRun">
                <Checks empty={labels.noInvariants} checks={detail.invariants} />
            </Part>
            {beforeAfter === undefined ? null : (
                <Part n={4} title={labels.beforeAfter.fixTitle} state={beforeAfter.after === undefined ? "notRun" : "done"}>
                    <FixBody view={beforeAfter} labels={labels.beforeAfter} />
                </Part>
            )}
            <Part n={3 + 2 * extra} title={labels.checkTitle} state={checkState}>
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
                {/* The way back to the reference step is the last, quiet line: a learner opens it only when stuck. */}
                {detail.reset === undefined ? null : (
                    <Disclosure
                        kind="quiet"
                        headingLevel={4}
                        title={labels.stuckTitle}
                        onExpandedChange={(isExpanded) => {
                            // Opening the solution reveals the case's fix (owner 2026-11-28): the app records the first expand.
                            if (isExpanded) props.onSolution?.(detail.id)
                        }}
                        body={
                            <Stack gap="inline">
                                <CommandLine command={detail.reset.command} copy={labels.copy} />
                                <Text tone="muted">{detail.reset.warning}</Text>
                            </Stack>
                        }
                    />
                )}
            </Part>
        </Stack>
    )
}
