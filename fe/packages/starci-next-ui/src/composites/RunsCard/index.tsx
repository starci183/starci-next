import { Badge, RelativeTime, SurfaceCard, type TableRowData } from "@starci/grammar/common"
import type { ProjectDetailLabels, ProjectDetailView, RunRowView } from "../ProjectAside/types"

/** The cells of one run row, by column id. */
const runRowOf = (row: RunRowView, locale: string): TableRowData => ({
    id: row.id,
    cells: {
        kind: row.kind,
        detail: row.detail,
        result: row.verdict === undefined ? null : <Badge tone={row.verdict.tone}>{row.verdict.label}</Badge>,
        at: row.at === "" ? null : <RelativeTime dateTime={row.at} locale={locale} size="sm" tone="muted" />,
    },
})

/** What the runs table needs: the project, the words and the language of its times. */
type RunsCardProps = {
    readonly view: ProjectDetailView
    readonly labels: ProjectDetailLabels
    readonly isLoading: boolean
    readonly locale: string
}

/** The latest runs: a table card with the signed CI run and the server probe run. */
export const RunsCard = (props: RunsCardProps) => (
    <SurfaceCard
        kind="table"
        label={props.labels.runsTitle}
        isLoading={props.isLoading}
        columns={[
            { id: "kind", label: props.labels.colKind },
            { id: "detail", label: props.labels.colDetail, priority: "low" },
            { id: "result", label: props.labels.colResult },
            { id: "at", label: props.labels.colAt, align: "end", priority: "low" },
        ]}
        rows={props.view.runs.map((row) => runRowOf(row, props.locale))}
        empty={props.labels.runsEmpty}
    />
)
