import { InlineStatus, Section, Stack, Text } from "@starci/grammar/common"
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

/** The mark of a case row: its state in the status glyph and the words of the state. */
const statusOf = (row: CourseCaseRowView) => {
    const state = ({ green: "done", red: "error", error: "error", open: "notRun", locked: "waiting" } as const)[
        row.status
    ]
    return <InlineStatus state={state} label={row.statusLabel} />
}

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
        <Stack gap="region">
            {view.intro === "" ? null : <Text as="p">{view.intro}</Text>}
            <Section
                kind="list"
                title={labels.listTitle}
                headingLevel={2}
                isLoading={props.isLoading === true}
                empty={labels.empty}
                items={view.cases.map((row) => ({
                    id: row.id,
                    title: row.title,
                    value: statusOf(row),
                    ...(row.isSelected ? {} : { onPress: () => props.onSelect(row.id) }),
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
