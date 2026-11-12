import { SurfaceCard, type ListRowData } from "@starci/grammar/common"
import { ProjectsGlyph } from "../../leaves/Icon"
import { RowProgress } from "../RowProgress"
import type { MilestoneRowView } from "../ProjectAside/types"

/** One milestone as a list row: its mark, name and proved count with a thin bar, the state chip, and the whole row a link. */
const milestoneRowOf = (row: MilestoneRowView, label: string): ListRowData => ({
    id: row.id,
    title: row.title,
    description: row.meta,
    leading: { icon: ProjectsGlyph },
    badges: [row.chip],
    href: row.href,
    control: <RowProgress label={`${label}: ${row.title}`} value={row.percent} />,
})

/** What the milestones card needs: its rows, its label and the line of its empty state. */
type MilestonesCardProps = {
    readonly rows: ReadonlyArray<MilestoneRowView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
}

/** The milestones: ONE list card, each row a real link to its milestone. */
export const MilestonesCard = (props: MilestonesCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        count={props.rows.length}
        isLoading={props.isLoading}
        items={props.rows.map((row) => milestoneRowOf(row, props.label))}
        empty={props.emptyLabel}
    />
)
