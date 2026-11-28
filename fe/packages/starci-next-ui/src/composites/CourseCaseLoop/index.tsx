import { InlineStatus, Section, Stack, Text, type MarkState } from "@starci/grammar/common"
import { numberGlyph } from "../../leaves/Icon"
import { CaseDetail, CommandLine } from "./detail"
import type { CourseCaseLoopLabels, CourseCaseLoopView, CourseCaseRowView } from "./types"

export type {
    CourseCaseDetailView,
    CourseCaseLoopLabels,
    CourseCaseLoopView,
    CourseCaseRowView,
    CourseCaseStatus,
    CourseCommandView,
    CourseCopyLabels,
    CourseHintLevelView,
    CourseInvariantView,
    CourseResetView,
} from "./types"

/** The state of a case as Grammar's mark reads it. */
const markOf = (row: CourseCaseRowView): MarkState =>
    ({ green: "done", red: "error", error: "error", open: "notRun", locked: "skipped" } as const)[row.status]

/** The words of a case row's state at its end. */
const statusOf = (row: CourseCaseRowView) => <InlineStatus state={markOf(row)} label={row.statusLabel} />

/** What a loop page needs. */
type CourseCaseLoopProps = {
    readonly view: CourseCaseLoopView
    readonly labels: CourseCaseLoopLabels
    readonly isLoading?: boolean
    readonly onSelect: (caseId: string) => void
    readonly onHint: (caseId: string, level: number) => void
}

/**
 * A loop of a lab, happy or unhappy: the cases in order as one list of hairline rows, each with its state; the selected case carries its
 * detail under its row (no accent on it: the open detail is the mark), so on a phone the detail stands right under the case it belongs
 * to. A line says what the loop is, and the lab's AI tools close it when the loop has them.
 */
export const CourseCaseLoop = (props: CourseCaseLoopProps) => {
    const { view, labels } = props
    return (
        // The main column at the reading measure, centred like every split page (owner 2026-11-28).
        <Stack gap="region" measure="reading">
            {view.intro === "" ? null : <Text as="p">{view.intro}</Text>}
            <Section
                kind="list"
                title={labels.listTitle}
                headingLevel={2}
                isLoading={props.isLoading === true}
                empty={labels.empty}
                // Every case is one row led by its round number (the 40 of a header); the selected one carries its detail under it.
                items={view.cases.map((row, index) => ({
                    id: row.id,
                    title: row.title,
                    value: statusOf(row),
                    leading: { icon: numberGlyph(index + 1), state: row.status === "green" ? "done" : markOf(row) },
                    // No accent edge on the selected row (owner 2026-11-28): its detail open under the list is the mark.
                    ...(row.isSelected ? {} : { onPress: () => props.onSelect(row.id) }),
                    // The selected case opens like an accordion (owner 2026-11-28): its detail stands right under its own row, in the row's
                    // title column (Grammar sets a leading row's detail one column in), so the next case follows it.
                    ...(row.isSelected && view.selected !== undefined
                        ? { detail: <CaseDetail detail={view.selected} labels={labels} onHint={props.onHint} /> }
                        : {}),
                }))}
            />
            {view.progress === "" ? null : (
                <Text role="caption" tone="muted">
                    {view.progress}
                </Text>
            )}
            {view.mcp === undefined ? null : <CommandLine command={view.mcp} copy={labels.copy} />}
        </Stack>
    )
}
