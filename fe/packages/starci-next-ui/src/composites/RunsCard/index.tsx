import { RelativeTime, Section, type ListRowData } from "@starci/grammar/common"
import type { ProjectDetailLabels, ProjectDetailView, RunRowView } from "../ProjectAside/types"

/** One run as a row: what ran, its detail, the verdict as a chip and when it ran. */
const runRowOf = (row: RunRowView, locale: string): ListRowData => ({
    id: row.id,
    title: row.kind,
    description: row.detail,
    ...(row.verdict === undefined ? {} : { badges: [row.verdict] }),
    ...(row.at === "" ? {} : { control: <RelativeTime dateTime={row.at} locale={locale} size="sm" tone="muted" /> }),
})

/** What the runs list needs: the project, the words and the language of its times. */
type RunsCardProps = {
    readonly view: ProjectDetailView
    readonly labels: ProjectDetailLabels
    readonly isLoading: boolean
    readonly locale: string
}

/** The latest runs: a flat list under its head with the signed CI run and the server probe run. */
export const RunsCard = (props: RunsCardProps) => (
    <Section
        kind="list"
        title={props.labels.runsTitle}
        headingLevel={2}
        isLoading={props.isLoading}
        items={props.view.runs.map((row) => runRowOf(row, props.locale))}
        empty={props.labels.runsEmpty}
    />
)
