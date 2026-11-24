import { HighlightedFence } from "../../branches/HighlightedCode/fence"
import { Button, Cluster, DescriptionList, InlineStatus, Section, Stack, Text } from "@starci/grammar/common"
import { NoMachineNotice } from "../NoMachineNotice"
import type { BugHuntLabels, BugHuntView, BugRowView } from "../LessonFiveParts/types"

export type { BugHuntLabels, BugHuntView, BugRowState, BugRowView } from "../LessonFiveParts/types"

/** The mark word of a test row: its newest run in the status glyph and the words of the state. */
const statusOf = (row: BugRowView) => {
    const state = ({ passed: "done", failed: "error", running: "running", none: "notRun", locked: "notRun" } as const)[
        row.state
    ]
    return <InlineStatus state={state} label={row.stateLabel} />
}

/** What the run strip needs. */
type RunStripProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly onCopy: (text: string) => void
}

/** The strip on top: the machine and the newest run, then the one command that pulls and runs the pack. */
const RunStrip = (props: RunStripProps) => {
    const { view, labels } = props
    return (
        <Stack gap="section">
            <Cluster gap="section" align="center">
                {view.machine === "" ? (
                    <InlineStatus state="waiting" label={labels.machineNone} />
                ) : (
                    <InlineStatus state="done" label={labels.machineOnline(view.machine)} />
                )}
                <Text tone="muted">{view.runTitle}</Text>
            </Cluster>
            <Stack gap="identity">
                <Text as="p" role="label.item">
                    {labels.pullTitle}
                </Text>
                <Text tone="muted">{labels.pullNote}</Text>
            </Stack>
            <HighlightedFence
                code={view.commands}
                language="bash"
                showLanguage={false}
                label={labels.pullTitle}
                action={
                    <Button variant="border" size="sm" onPress={() => props.onCopy(view.commands)}>
                        {labels.copy}
                    </Button>
                }
            />
            {view.machine === "" ? (
                <NoMachineNotice
                    title={labels.machineNone}
                    note={labels.machineNoneNote}
                    details={labels.machineDetails}
                />
            ) : null}
        </Stack>
    )
}

/** What the detail of one test needs. */
type DetailProps = {
    readonly row: BugRowView
    readonly labels: BugHuntLabels
    readonly onHint: (testId: string) => void
}

/** What a red test shows under its row: why it is not green yet, the two numbers, the hints opened so far and the button for the next. */
const RedDetail = (props: DetailProps) => {
    const { row, labels } = props
    return (
        <Stack gap="inline">
            {row.fail === "" ? null : <Text as="p">{row.fail}</Text>}
            {row.expected === "" ? null : (
                <DescriptionList
                    layout="grid"
                    items={[
                        { id: "expected", term: labels.expected, description: `${row.expected} ${row.measure}`.trim() },
                        { id: "received", term: labels.received, description: `${row.received} ${row.measure}`.trim() },
                    ]}
                />
            )}
            {row.hints.map((hint) => (
                <Text key={hint.id} as="p">
                    <Text as="span" role="label.item">
                        {`${hint.label}. `}
                    </Text>
                    {hint.text}
                </Text>
            ))}
            {row.nextHint === "" ? null : (
                <Cluster gap="inline">
                    <Button
                        variant="border"
                        size="sm"
                        isPending={row.isOpeningHint}
                        onPress={() => props.onHint(row.id)}
                    >
                        {row.nextHint}
                    </Button>
                </Cluster>
            )}
        </Stack>
    )
}

/** What the part needs. */
type EssentialBugHuntProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly isLoading?: boolean
    readonly onCopy: (text: string) => void
    readonly onHint: (testId: string) => void
}

/** The detail under a row: why a red test is red, or why a green one is right now. */
const detailOf = (row: BugRowView, labels: BugHuntLabels, onHint: (testId: string) => void) => {
    if (row.state === "failed") return { detail: <RedDetail row={row} labels={labels} onHint={onHint} /> }
    if (row.state === "passed" && row.pass !== "")
        return {
            detail: (
                <Text as="p" tone="muted">
                    <Text as="span" role="label.item">
                        {`${labels.passTitle}. `}
                    </Text>
                    {row.pass}
                </Text>
            ),
        }
    return {}
}

/**
 * Tìm sạn: the machine and the newest run, the one command that pulls and runs the bug pack, then every test as a row (what it
 * checks, its state). A red row opens its symptom, the two numbers and its hints one at a time; the final test waits for the rest.
 */
export const EssentialBugHunt = (props: EssentialBugHuntProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <RunStrip view={view} labels={labels} onCopy={props.onCopy} />
            <Section
                kind="list"
                title={labels.testsTitle(view.total)}
                headingLevel={2}
                isLoading={isLoading}
                empty={labels.runsEmpty}
                items={view.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    description: row.caption,
                    value: statusOf(row),
                    ...detailOf(row, labels, props.onHint),
                }))}
            />
        </Stack>
    )
}
