import { Cluster, Stepper, SurfaceCard, Text, type StepperStepState } from "@starci/grammar/common"
import { LockIcon } from "../../leaves/Icon"

/** One lesson of the topic path in the teacher's module order. */
export type TopicPathRow = {
    readonly id: string
    readonly title: string
    /** Difficulty, minutes and phases for a published lesson, or what is pending, already in words. */
    readonly meta: string
    /** The status in words ("coming soon" or where the learner stands). */
    readonly status: string
    /** The destination of a published lesson; empty for a lesson not yet moved. */
    readonly href: string
    /** The words of the button that opens a published lesson (start, continue, view); empty for a lesson not yet moved. */
    readonly cta: string
    readonly isOpen: boolean
    /** The six phases of the lesson as the learner stands on them (Premium only); empty draws no rings. */
    readonly phases?: ReadonlyArray<{
        readonly id: string
        readonly label: string
        readonly state: "done" | "current" | "later"
    }>
    /** The words of the phase count ("3/6 pha"); empty hides it. */
    readonly phasesNote?: string
}

/** The path of a topic. */
type TopicPathProps = {
    readonly label: string
    readonly emptyLabel: string
    readonly rows: ReadonlyArray<TopicPathRow>
    /** The accessible name of the six rings of a row and the words of a finished phase. */
    readonly ringsLabel: string
    readonly doneLabel: string
}

/** The rings carry no words (the count beside them speaks); this blank label only gives each marker its breathing room in the Stepper. */
const RING_GAP = "  "

/** The Grammar state of each phase state. */
const RING_STATE: Readonly<Record<"done" | "current" | "later", StepperStepState>> = {
    done: "complete",
    current: "current",
    later: "upcoming",
}

/** What the rings of a row need. */
type RingsProps = { readonly row: TopicPathRow; readonly ringsLabel: string; readonly doneLabel: string }

/** The six rings of a lesson (done = check, current = accent, later = muted) with the count of finished phases. */
const Rings = (props: RingsProps) => {
    const phases = props.row.phases ?? []
    const current = phases.find((each) => each.state === "current")
    return (
        <Cluster gap="inline">
            <Stepper
                label={props.ringsLabel}
                size="dense"
                completeMarker="check"
                steps={phases.map((each) => ({ id: each.id, label: RING_GAP, state: RING_STATE[each.state] }))}
                currentStepId={current?.id ?? ""}
                stateLabel={(state) => (state === "complete" ? props.doneLabel : undefined)}
            />
            {props.row.phasesNote === undefined || props.row.phasesNote === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.row.phasesNote}
                </Text>
            )}
        </Cluster>
    )
}

/** The end of a row: the rings of an open lesson with phases, the state chip of one without, the lock of a lesson not yet open. */
const endOf = (row: TopicPathRow, props: TopicPathProps) => {
    if (!row.isOpen) return { control: <LockIcon label={row.status} />, state: "neutral" as const }
    if ((row.phases ?? []).length === 0)
        return { badges: [{ label: row.status, tone: "accent" }] as const, state: "informative" as const }
    return { control: <Rings row={row} ringsLabel={props.ringsLabel} doneLabel={props.doneLabel} /> }
}

/**
 * The lessons of a topic as ONE numbered list card, in the teacher's order: a numbered mark, the lesson name, a muted one-liner and, at the end,
 * the six phase rings with their count (Premium) or the state chip of a published lesson (a row that opens the lesson, with its chevron) or the outline lock of a lesson not yet open.
 */
export const TopicPath = (props: TopicPathProps) => (
    <SurfaceCard
        kind="list"
        label={props.label}
        count={props.rows.length}
        empty={props.emptyLabel}
        items={props.rows.map((row, index) => ({
            id: row.id,
            title: row.title,
            description: row.meta,
            leading: { position: index + 1 },
            ...endOf(row, props),
            ...(row.href === "" ? {} : { href: row.href }),
        }))}
    />
)
