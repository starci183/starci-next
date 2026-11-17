import type { ReactNode } from "react"
import { Badge, DataTable, RelativeTime, Section, type DataTableColumn } from "@starci/grammar/common"
import type { ProjectDetailLabels, ProjectDetailView, RunRowView } from "../ProjectAside/types"

/** The cell of one run row, by column id. */
const runCellOf = (row: RunRowView, column: string, locale: string): ReactNode => {
    if (column === "kind") return row.kind
    if (column === "detail") return row.detail
    if (column === "result")
        return row.verdict === undefined ? null : <Badge tone={row.verdict.tone}>{row.verdict.label}</Badge>
    return row.at === "" ? null : <RelativeTime dateTime={row.at} locale={locale} size="sm" tone="muted" />
}

/** What the runs table needs: the project, the words and the language of its times. */
type RunsCardProps = {
    readonly view: ProjectDetailView
    readonly labels: ProjectDetailLabels
    readonly isLoading: boolean
    readonly locale: string
}

/** The latest runs: a flat table under its section with the signed CI run and the server probe run. */
export const RunsCard = (props: RunsCardProps) => (
    <Section title={props.labels.runsTitle} isLoading={props.isLoading}>
        <DataTable
            label={props.labels.runsTitle}
            isLoading={props.isLoading}
            columns={
                [
                    { id: "kind", label: props.labels.colKind },
                    { id: "detail", label: props.labels.colDetail, priority: "low" },
                    { id: "result", label: props.labels.colResult },
                    { id: "at", label: props.labels.colAt, align: "end", priority: "low" },
                ] satisfies DataTableColumn[]
            }
            rows={props.view.runs}
            renderCell={(row, column) => runCellOf(row, column, props.locale)}
            emptyContent={props.labels.runsEmpty}
        />
    </Section>
)
