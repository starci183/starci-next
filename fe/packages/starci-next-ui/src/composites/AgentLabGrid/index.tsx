import { Cluster, Link, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One step of an open lab, with the official doc page it cites. */
export type AgentLabStepRow = {
    readonly text: string
    readonly sourceUrl: string
}

/** One concept of a track and its lab, already in words. */
export type AgentLabCell = {
    readonly id: string
    /** The concept name. */
    readonly title: string
    /** The lab title, or the note that the teacher is writing it. */
    readonly description: string
    /** The state badge words (being written, draft, outdated, locked, open). */
    readonly badge: string
    readonly badgeTone: "success" | "warning" | "muted" | "neutral"
    /** The steps of an open lab; empty for every other state. */
    readonly steps: ReadonlyArray<AgentLabStepRow>
}

/** The grid of labs of one track. */
type AgentLabGridProps = {
    readonly label: string
    readonly emptyLabel: string
    /** The words of the link to the official doc page of a step. */
    readonly sourceLabel: string
    readonly cells: ReadonlyArray<AgentLabCell>
    readonly isLoading?: boolean
}

/** The steps of an open lab, each with the link to the doc page it cites. */
const stepsOf = (steps: ReadonlyArray<AgentLabStepRow>, sourceLabel: string) =>
    steps.length === 0 ? undefined : (
        <Stack gap="row">
            {steps.map((step) => (
                <Cluster key={step.text} gap="inline" wrap align="center">
                    <Text as="span">{step.text}</Text>
                    <Link variant="plain" href={step.sourceUrl}>
                        {sourceLabel}
                    </Link>
                </Cluster>
            ))}
        </Stack>
    )

/** The labs of a track: one numbered row per mindset concept with the state of its lab; no lab text is invented while the teacher is still writing. */
export const AgentLabGrid = (props: AgentLabGridProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        empty={props.emptyLabel}
        {...(props.isLoading === true ? { isLoading: true } : {})}
        items={props.cells.map((cell, index) => {
            const detail = stepsOf(cell.steps, props.sourceLabel)
            return {
                id: cell.id,
                title: cell.title,
                description: cell.description,
                leading: { position: index + 1 },
                badges: [{ label: cell.badge, tone: cell.badgeTone }] as const,
                ...(detail === undefined ? {} : { detail }),
            }
        })}
    />
)
