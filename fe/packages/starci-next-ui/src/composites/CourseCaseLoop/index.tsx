import { Accordion, Cluster, IconTile, InlineStatus, Section, Stack, Text, type MarkState } from "@starci/grammar/common"
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
            {/* The cases as HeroUI's accordion through Grammar (owner 2026-11-28: "đọc kĩ accordion của heroui"): each case's head is its round
                number (the 40 of a header), its title and its state; HeroUI draws the caret at the end and turns it when the case opens; the
                open case is the selected one, its detail the panel. */}
            <Section title={labels.listTitle} headingLevel={2} isLoading={props.isLoading === true}>
                {view.cases.length === 0 ? (
                    <Text as="p" tone="muted">
                        {labels.empty}
                    </Text>
                ) : (
                    <Accordion
                        label={labels.listTitle}
                        headingLevel={3}
                        expandedIds={view.selected === undefined ? [] : [view.selected.id]}
                        onExpandedChange={(ids) => {
                            const opened = ids.find((id) => id !== view.selected?.id)
                            if (opened !== undefined) props.onSelect(opened)
                        }}
                        items={view.cases.map((row, index) => ({
                            id: row.id,
                            title: (
                                // The number and the title at the start, the state at the end, just before HeroUI's caret.
                                <Cluster gap="row" align="center" justify="between" wrap={false}>
                                    <Cluster gap="row" align="center" wrap={false}>
                                        <IconTile
                                            source={numberGlyph(index + 1)}
                                            state={row.status === "green" ? "done" : markOf(row)}
                                        />
                                        <Text>{row.title}</Text>
                                    </Cluster>
                                    {statusOf(row)}
                                </Cluster>
                            ),
                            content:
                                row.isSelected && view.selected !== undefined ? (
                                    <CaseDetail detail={view.selected} labels={labels} onHint={props.onHint} />
                                ) : null,
                        }))}
                    />
                )}
            </Section>
            {view.progress === "" ? null : (
                <Text role="caption" tone="muted">
                    {view.progress}
                </Text>
            )}
            {view.mcp === undefined ? null : <CommandLine command={view.mcp} copy={labels.copy} />}
        </Stack>
    )
}
