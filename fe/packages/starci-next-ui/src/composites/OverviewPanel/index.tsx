import type { ReactNode } from "react"
import { Disclosure, Grid, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { LockIcon } from "../../leaves/Icon"

/** The words of the overview, resolved by its block. */
export type OverviewPanelLabels = {
    /** The label of the opening card. */
    readonly title: string
    /** The term of the row that says what the lesson is about. */
    readonly about: string
    /** The term of the row that holds the scope, folded. */
    readonly scope: string
    /** The words of the disclosure that opens the scope. */
    readonly scopeShow: string
    readonly outcomes: string
    readonly prerequisites: string
    /** The label of the one card that lists the phases. */
    readonly phases: string
    /** The chip of a phase the reader may open. */
    readonly open: string
    /** The chip of a phase the learner has finished. */
    readonly done: string
    /** The accessible name of the lock on a phase that needs Premium. */
    readonly locked: string
    readonly empty: string
    /** The words of the band's primary action: the way into the first phase. */
    readonly start: string
}

/** A statement of an outcome or a prerequisite. */
type OverviewStatement = { readonly id: string; readonly text: string }

/** One phase of the lesson, worded by its block, with the way into it. */
type OverviewPhase = {
    readonly id: string
    readonly title: string
    /** The one-line description of the phase. */
    readonly description: string
    readonly href: string
    /** True when the reader's plan does not include the phase: the row shows a lock in place of the chip. */
    readonly isLocked: boolean
    /** True when the learner has finished the phase: the chip says so in place of "open". */
    readonly isDone: boolean
}

/** The overview of a lesson: what it is about, the phases, what the learner can do after it and what they should know first. */
type OverviewPanelProps = {
    /** What the lesson is about, in one or two sentences; empty hides the row. */
    readonly summary: string
    readonly outcomes: ReadonlyArray<OverviewStatement>
    readonly prerequisites: ReadonlyArray<OverviewStatement>
    /** The phases the lesson has, in order. */
    readonly phases: ReadonlyArray<OverviewPhase>
    /** The line that says the lesson is complete (with when); undefined before the completion. */
    readonly completion: string | undefined
    /** The scope text of the lesson, folded under a disclosure; undefined hides the row. */
    readonly scope: ReactNode | undefined
    readonly labels: OverviewPanelLabels
}

/** The overview card: a list of rows, each a term and its value. */
const AboutCard = (props: Pick<OverviewPanelProps, "summary" | "scope" | "labels">) => {
    const items = [
        ...(props.summary === "" ? [] : [{ id: "about", term: props.labels.about, description: props.summary }]),
        ...(props.scope === undefined
            ? []
            : [
                  {
                      id: "scope",
                      term: props.labels.scope,
                      description: <Disclosure title={props.labels.scopeShow} body={props.scope} />,
                  },
              ]),
    ]
    if (items.length === 0) return null
    return <SurfaceCard kind="details" label={props.labels.title} items={items} />
}

/** The chip of a phase: finished (success) or open (neutral). */
const phaseBadgeOf = (phase: OverviewPhase, labels: OverviewPanelLabels) =>
    phase.isDone ? { label: labels.done, tone: "success" as const } : { label: labels.open, tone: "neutral" as const }

/** What the line under a phase name needs. */
type PhaseLineProps = { readonly text: string }

/** The line under a phase name: 12, muted. */
const PhaseLine = (props: PhaseLineProps) => (
    <Text size="xs" tone="muted">
        {props.text}
    </Text>
)

/**
 * The overview: the opening card of facts, the one list of the phases (a numbered row each, the chip "open" or a lock, the chevron of a row that
 * leads somewhere), then what the learner can do after the lesson beside what to know before it.
 */
export const OverviewPanel = (props: OverviewPanelProps) => (
    <Stack gap="section">
        <AboutCard summary={props.summary} scope={props.scope} labels={props.labels} />
        {props.completion === undefined ? null : (
            <SurfaceCard
                kind="list"
                ariaLabel={props.completion}
                empty={props.completion}
                items={[{ id: "completion", title: props.completion, state: "affirmative" }]}
            />
        )}
        <SurfaceCard
            kind="list"
            label={props.labels.phases}
            empty={props.labels.empty}
            items={props.phases.map((phase, index) => ({
                id: phase.id,
                title: phase.title,
                description: <PhaseLine text={phase.description} />,
                leading: { position: index + 1 },
                href: phase.href,
                ...(phase.isLocked
                    ? { control: <LockIcon label={props.labels.locked} /> }
                    : { badges: [phaseBadgeOf(phase, props.labels)] as const }),
            }))}
        />
        <Grid kind="cards" columns={2}>
            <SurfaceCard
                kind="list"
                label={props.labels.outcomes}
                empty={props.labels.empty}
                items={props.outcomes.map((outcome) => ({ id: outcome.id, title: outcome.text }))}
            />
            <SurfaceCard
                kind="list"
                label={props.labels.prerequisites}
                empty={props.labels.empty}
                items={props.prerequisites.map((each) => ({ id: each.id, title: each.text }))}
            />
        </Grid>
    </Stack>
)
