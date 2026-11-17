import { Cluster, Divider, Progress, Section, Stack, StatusDot, Text } from "@starci/grammar/common"
import { HubGoalEditor, type HubGoalEditorLabels, type HubGoalEditorState } from "../HubGoalEditor"

/** One of the seven days of the strip. */
export type HubDayView = {
    readonly id: string
    readonly label: string
    /** Counted toward the streak, covered by a freeze, today still open, or missed. */
    readonly state: "counted" | "freeze" | "today" | "missed"
    /** The spoken name of the state. */
    readonly title: string
}

/** The streak, every word resolved. */
export type HubStreakView = {
    /** The run as a figure and its unit (a figure, then "days in a row"). */
    readonly currentFigure: string
    readonly currentUnit: string
    /** The one 12 muted line: the best run and the freezes left. */
    readonly line: string
    readonly weekTitle: string
    readonly weekLabel: string
    /** The share of the weekly goal reached, 0 to 100. */
    readonly weekPercent: number
    readonly days: ReadonlyArray<HubDayView>
}

/** The fixed words of the streak sections. */
export type HubStreakLabels = {
    readonly title: string
    readonly goalBar: string
    readonly dayStripLabel: string
}

/** The tone a day dot takes. */
type DotTone = "accent" | "warning" | "neutral"

/** Counted days are accent, a freeze warns, every other day is neutral. */
const TONES: Readonly<Record<HubDayView["state"], DotTone>> = {
    counted: "accent",
    freeze: "warning",
    today: "neutral",
    missed: "neutral",
}

/** What one day of the strip needs. */
type DayProps = { readonly day: HubDayView }

/** One day of the strip: its weekday and Grammar's status dot. */
const Day = (props: DayProps) => (
    <Stack gap="identity" align="center">
        <Text tone="muted" size="xs">
            {props.day.label}
        </Text>
        <StatusDot
            tone={TONES[props.day.state]}
            size="lg"
            aria-label={props.day.title}
            echo={props.day.state === "today"}
        />
    </Stack>
)

/** What the streak section is given. */
type HubStreakSectionProps = {
    readonly view: HubStreakView
    readonly labels: HubStreakLabels
    readonly isLoading?: boolean
}

/** The streak section of the aside: the run as a figure with its unit, the best run, and the seven days. */
const HubStreakSection = (props: HubStreakSectionProps) => (
    <Section title={props.labels.title} headingLevel={2} {...(props.isLoading === true ? { isLoading: true } : {})}>
        <Stack gap="inline">
            <Cluster gap="identity" align="baseline">
                <Text as="p" size="figure">
                    {props.view.currentFigure}
                </Text>
                <Text size="figure" tone="muted">
                    {props.view.currentUnit}
                </Text>
            </Cluster>
            <Text tone="muted" size="xs">
                {props.view.line}
            </Text>
            <Cluster gap="identity" label={props.labels.dayStripLabel} justify="between">
                {props.view.days.map((day) => (
                    <Day key={day.id} day={day} />
                ))}
            </Cluster>
        </Stack>
    </Section>
)

/** What the weekly goal section is given. */
type HubGoalSectionProps = {
    readonly view: HubStreakView
    readonly goalBar: string
    readonly goalState: HubGoalEditorState
    readonly goalLabels: HubGoalEditorLabels
    readonly onGoalOpenChange: (isOpen: boolean) => void
    readonly onGoalChoose: (value: string) => void
    readonly onGoalSave: () => void
    readonly isLoading?: boolean
}

/** The weekly goal section of the aside: the days reached (a chip beside the title), the bar and the command that changes the goal. */
const HubGoalSection = (props: HubGoalSectionProps) => (
    <Section
        title={props.view.weekTitle}
        headingLevel={2}
        fact={props.view.weekLabel}
        {...(props.isLoading === true ? { isLoading: true } : {})}
    >
        <Stack gap="inline">
            <Progress label={props.goalBar} value={props.view.weekPercent} valueText={props.view.weekLabel} />
            <HubGoalEditor
                state={props.goalState}
                labels={props.goalLabels}
                onOpenChange={props.onGoalOpenChange}
                onChoose={props.onGoalChoose}
                onSave={props.onGoalSave}
            />
        </Stack>
    </Section>
)

/** What the streak card is given. */
type HubStreakCardProps = HubStreakSectionProps & Omit<HubGoalSectionProps, "view" | "isLoading" | "goalBar">

/** The streak and the weekly goal as the two first sections of the aside, a divider between them. */
export const HubStreakCard = (props: HubStreakCardProps) => (
    <>
        <HubStreakSection
            view={props.view}
            labels={props.labels}
            {...(props.isLoading === true ? { isLoading: true } : {})}
        />
        <Divider semantics="presentation" />
        <HubGoalSection {...props} goalBar={props.labels.goalBar} />
    </>
)
