import { SurfaceCard, type ListRowData } from "@starci/grammar/common"
import { PracticeGlyph } from "../../leaves/Icon"
import type { ProbeLineView } from "../ProjectAside/types"

/** What the probes card needs: the probe rows, its label and the line of its empty state. */
type ProbesCardProps = {
    readonly rows: ReadonlyArray<ProbeLineView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
}

/** The probes of the last server run: a list card shown only when there are results. */
export const ProbesCard = (props: ProbesCardProps) =>
    props.rows.length === 0 ? null : (
        <SurfaceCard
            kind="list"
            label={props.label}
            count={props.rows.length}
            isLoading={props.isLoading}
            items={props.rows.map((probe): ListRowData => ({
                id: probe.id,
                title: probe.text,
                leading: { icon: PracticeGlyph },
                badges: [probe.chip],
            }))}
            empty={props.emptyLabel}
        />
    )
