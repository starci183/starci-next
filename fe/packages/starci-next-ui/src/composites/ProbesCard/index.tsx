import { Grid, Section, SurfaceCard } from "@starci/grammar/common"
import type { ChipView, ProbeLineView } from "../ProjectAside/types"

/** What the probes card needs: the probe rows, its label and the line of its empty state. */
type ProbesCardProps = {
    readonly rows: ReadonlyArray<ProbeLineView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
}

/** The ground a probe tile takes: green for a pass, red for a fail, none otherwise. */
const groundOf = (chip: ChipView): { readonly groundTone?: "success" | "danger" } =>
    chip.tone === "success" ? { groundTone: "success" } : chip.tone === "warning" ? { groundTone: "danger" } : {}

/** The probes of the last server run as one tile each, green or red; shown only when there are results. */
export const ProbesCard = (props: ProbesCardProps) =>
    props.rows.length === 0 ? null : (
        <Section title={props.label} headingLevel={2} count={props.rows.length} isLoading={props.isLoading}>
            <Grid kind="cards" columns={3}>
                {props.rows.map((probe) => (
                    <SurfaceCard
                        key={probe.id}
                        kind="tile"
                        name={probe.text}
                        badge={{ label: probe.chip.label, tone: probe.chip.tone, isDot: true }}
                        {...groundOf(probe.chip)}
                    />
                ))}
            </Grid>
        </Section>
    )
