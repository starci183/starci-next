import { LockIcon } from "../../leaves/Icon"
import { Heading, Progress, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The words of the rail, resolved by its block. */
export type StudyRailLabels = {
    readonly phases: string
    readonly outcomes: string
    /** What the outcomes card says to a reader whose plan does not track them. */
    readonly outcomesLocked: string
    readonly empty: string
    /** The accessible name of the lock on what needs Premium. */
    readonly locked: string
}

/** One phase of the rail, worded by its block. */
type StudyRailPhase = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly href: string
    readonly isCurrent: boolean
    readonly isLocked: boolean
}

/** The lesson summary and the phase navigator of a lesson. */
type StudyRailProps = {
    /** The small line over the title: the group of the lesson and its difficulty, already in words. */
    readonly eyebrow: string
    readonly title: string
    /** The minutes and the implementation language, already in words. */
    readonly facts: string
    readonly phases: ReadonlyArray<StudyRailPhase>
    /** One bar per learning outcome, 0 to 100. */
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string; readonly value: number }>
    /** True when the reader's plan does not track outcomes: the card says so instead of drawing empty bars. */
    readonly isOutcomesLocked: boolean
    readonly labels: StudyRailLabels
}

/** The learning outcomes of the lesson as bars, or, for a reader without Premium, the line that says why there are none. */
const OutcomesCard = (props: Pick<StudyRailProps, "outcomes" | "isOutcomesLocked" | "labels">) => {
    if (props.outcomes.length === 0) return null
    return (
        <SurfaceCard label={props.labels.outcomes}>
            <Stack gap="row">
                {props.isOutcomesLocked ? (
                    <Text size="sm" tone="muted" startContent={<LockIcon label={props.labels.locked} />}>
                        {props.labels.outcomesLocked}
                    </Text>
                ) : (
                    props.outcomes.map((outcome) => (
                        <Progress key={outcome.id} label={outcome.text} value={outcome.value} />
                    ))
                )}
            </Stack>
        </SurfaceCard>
    )
}

/**
 * The left column of a lesson: the lesson card (group and difficulty, name, minutes) over the phase navigator, numbered rows
 * that link to `?phase=` so the address always names the phase on screen, the current one marked and the ones that need
 * Premium carrying a lock; the learning outcomes close the column.
 */
export const StudyRail = (props: StudyRailProps) => (
    <Stack gap="section">
        <SurfaceCard ariaLabel={props.title}>
            <Stack gap="identity">
                <Text size="sm" tone="muted">
                    {props.eyebrow}
                </Text>
                <Heading level={2} scale="standard">
                    {props.title}
                </Heading>
                <Text size="sm" tone="muted">
                    {props.facts}
                </Text>
            </Stack>
        </SurfaceCard>
        <SurfaceCard
            kind="list"
            label={props.labels.phases}
            empty={props.labels.empty}
            items={props.phases.map((phase, index) => ({
                id: phase.id,
                title: phase.title,
                description: phase.description,
                href: phase.href,
                leading: { position: index + 1 },
                state: phase.isCurrent ? "informative" : "neutral",
                ...(phase.isLocked ? { control: <LockIcon label={props.labels.locked} /> } : {}),
            }))}
        />
        <OutcomesCard outcomes={props.outcomes} isOutcomesLocked={props.isOutcomesLocked} labels={props.labels} />
    </Stack>
)
