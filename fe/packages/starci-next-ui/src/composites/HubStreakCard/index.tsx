import { Badge, Cluster, Progress, Stack, StatusDot, SurfaceCard, Text } from "@starci/grammar/common"
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

/** The streak card, every word resolved. */
export type HubStreakView = {
    readonly current: string
    readonly longest: string
    readonly freezes: string
    readonly weekLabel: string
    /** The share of the weekly goal reached, 0 to 100. */
    readonly weekPercent: number
    readonly days: ReadonlyArray<HubDayView>
}

/** The fixed words of the streak card. */
export type HubStreakLabels = {
    readonly title: string
    readonly rule: string
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

/** The streak card of the learn hub: the run, a 7-day strip, the weekly goal, freezes, the goal editor and the rule in words. */
type HubStreakCardProps = {
    readonly view: HubStreakView
    readonly labels: HubStreakLabels
    readonly goalState: HubGoalEditorState
    readonly goalLabels: HubGoalEditorLabels
    readonly onGoalOpenChange: (isOpen: boolean) => void
    readonly onGoalChoose: (value: string) => void
    readonly onGoalSave: () => void
    readonly isLoading?: boolean
}

/** What one day of the strip needs. */
type DayProps = { readonly day: HubDayView }

/** One day of the strip: its weekday and a dot. */
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

/** The streak card; it never says the streak earns experience. */
export const HubStreakCard = (props: HubStreakCardProps) => (
    <SurfaceCard label={props.labels.title} {...(props.isLoading === true ? { isLoading: true } : {})}>
        <Stack gap="section">
            <Cluster gap="row" align="baseline">
                <Text as="p" size="md">
                    {props.view.current}
                </Text>
                <Badge tone="accent">{props.view.freezes}</Badge>
            </Cluster>
            <Text tone="muted">{props.view.longest}</Text>
            <Cluster gap="row" label={props.labels.dayStripLabel} justify="between">
                {props.view.days.map((day) => (
                    <Day key={day.id} day={day} />
                ))}
            </Cluster>
            <Progress label={props.labels.goalBar} value={props.view.weekPercent} valueText={props.view.weekLabel} />
            <Text size="sm">{props.view.weekLabel}</Text>
            <HubGoalEditor
                state={props.goalState}
                labels={props.goalLabels}
                onOpenChange={props.onGoalOpenChange}
                onChoose={props.onGoalChoose}
                onSave={props.onGoalSave}
            />
            <Text tone="muted" size="xs">
                {props.labels.rule}
            </Text>
        </Stack>
    </SurfaceCard>
)
