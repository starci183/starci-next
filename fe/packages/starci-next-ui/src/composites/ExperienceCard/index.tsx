import { Link, SurfaceCard, type ListRowData } from "@starci/grammar/common"
import { ExperienceGlyph } from "../../leaves/Icon"
import type { ExperienceRowView, ProjectDetailLabels } from "../ProjectAside/types"

/** What the experience card needs: its rows, the words of its head and its empty state. */
type ExperienceCardProps = {
    readonly rows: ReadonlyArray<ExperienceRowView>
    readonly labels: Pick<ProjectDetailLabels, "expTitle" | "expLink" | "expEmpty" | "experienceHref">
    readonly isLoading: boolean
}

/** The experience this project earned: one list card with a head link to the experience page. */
export const ExperienceCard = (props: ExperienceCardProps) => (
    <SurfaceCard
        kind="list"
        label={props.labels.expTitle}
        labelEnd={
            <Link variant="head" href={props.labels.experienceHref}>
                {props.labels.expLink}
            </Link>
        }
        isLoading={props.isLoading}
        items={props.rows.map((row): ListRowData => ({
            id: row.id,
            title: row.title,
            leading: { icon: ExperienceGlyph },
            meta: { text: String(row.count) },
        }))}
        empty={props.labels.expEmpty}
    />
)
