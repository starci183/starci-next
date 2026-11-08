import type { ReactNode } from "react"
import { EntryList } from "../EntryList"
import { Button, DisclosureList, Grid, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The words of the overview, resolved by its block. */
export type OverviewPanelLabels = {
    readonly title: string
    readonly outcomes: string
    readonly prerequisites: string
    readonly phases: string
    readonly start: string
    readonly scope: string
    readonly references: string
    readonly empty: string
}

/** A statement of an outcome or a prerequisite. */
type OverviewStatement = { readonly id: string; readonly text: string }

/** The overview of a lesson: what the learner can do after it, what they should know first, the phases and the sources. */
type OverviewPanelProps = {
    /** What the lesson is about, in one or two sentences; empty hides the opening card. */
    readonly summary: string
    readonly outcomes: ReadonlyArray<OverviewStatement>
    readonly prerequisites: ReadonlyArray<OverviewStatement>
    /** The phases that follow, worded by their block. */
    readonly phases: ReadonlyArray<{ readonly id: string; readonly title: string; readonly description: string }>
    /** The sources the lesson cites; a source with no address is listed without a link. */
    readonly references: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
    /** The scope text of the lesson, shown folded under a disclosure; undefined hides the disclosure. */
    readonly scope: ReactNode | undefined
    /** The destination of the first phase. */
    readonly startHref: string
    readonly labels: OverviewPanelLabels
}

/** Outcomes and prerequisites side by side, the phases under them, the scope folded away, the sources and the one way to begin. */
export const OverviewPanel = (props: OverviewPanelProps) => (
    <Stack gap="section">
        {props.summary === "" ? null : (
            <SurfaceCard label={props.labels.title}>
                <Text as="p">{props.summary}</Text>
            </SurfaceCard>
        )}
        <Grid
            kind="pair"
            leading={
                <SurfaceCard
                    kind="list"
                    label={props.labels.outcomes}
                    empty={props.labels.empty}
                    items={props.outcomes.map((outcome) => ({ id: outcome.id, title: outcome.text }))}
                />
            }
            trailing={
                <SurfaceCard
                    kind="list"
                    label={props.labels.prerequisites}
                    empty={props.labels.empty}
                    items={props.prerequisites.map((each) => ({ id: each.id, title: each.text }))}
                />
            }
        />
        <SurfaceCard
            kind="list"
            label={props.labels.phases}
            empty={props.labels.empty}
            items={props.phases.map((phase, index) => ({
                id: phase.id,
                title: phase.title,
                description: phase.description,
                leading: { position: index + 1 },
            }))}
        />
        {props.scope === undefined ? null : (
            <DisclosureList
                label={props.labels.scope}
                items={[{ id: "scope", title: props.labels.scope, body: props.scope }]}
            />
        )}
        {props.references.length === 0 ? null : (
            <EntryList
                label={props.labels.references}
                empty={props.labels.empty}
                entries={props.references.map((reference) => ({
                    id: reference.id,
                    title: reference.label,
                    href: reference.href,
                }))}
            />
        )}
        <Button intent="commit" href={props.startHref}>
            {props.labels.start}
        </Button>
    </Stack>
)
