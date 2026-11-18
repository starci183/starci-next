import { PrimaryRailLayout, Section } from "@starci/grammar/common"
import { ScenarioDetail } from "./Detail"
import type { ScenarioState, ScenariosLabels, ScenariosPartView } from "./types"

export type {
    ScenarioAskLabels,
    ScenarioDetailView,
    ScenarioGuardView,
    ScenarioHintView,
    ScenarioRowView,
    ScenarioState,
    ScenariosLabels,
    ScenariosPartView,
} from "./types"

/** What the scenarios part needs: the view, the words, the connector page and what the learner does. */
type EssentialScenariosProps = {
    readonly part: ScenariosPartView
    readonly labels: ScenariosLabels
    /** The page that connects the Claude or ChatGPT of the learner to the StarCi connector. */
    readonly connectHref: string
    readonly isLoading?: boolean
    readonly onSelect: (scenarioId: string) => void
    readonly onGuard: (flag: string, isOff: boolean) => void
    readonly onReveal: (scenarioId: string) => void
    readonly onCopy: (text: string) => void
}

/** The badge tone of a scenario state. */
const scenarioTone = (state: ScenarioState) => {
    if (state === "passed") return "success" as const
    if (state === "failed") return "danger" as const
    if (state === "running" || state === "guarded") return "warning" as const
    return "muted" as const
}

/**
 * The scenarios part: the scenarios as a flat list with the green count, and the one on screen: the machine, the result the relay
 * brought back (the page polls while a run is in flight), why it is red, the hint, the fix for the AI of the learner and the guard
 * switch.
 */
export const EssentialScenarios = (props: EssentialScenariosProps) => {
    const { part, labels } = props
    return (
        <PrimaryRailLayout
            railPosition="leading"
            collapsedOrder="rail-first"
            railWidth="medium"
            rail={
                <Section
                    kind="list"
                    title={labels.list}
                    headingLevel={2}
                    fact={part.summary}
                    empty={labels.empty}
                    isLoading={props.isLoading === true}
                    caption={labels.flow}
                    items={part.rows.map((row) => ({
                        id: row.id,
                        title: row.title,
                        description: row.fault,
                        badges: [{ label: row.stateLabel, tone: scenarioTone(row.state) }] as const,
                        onPress: () => props.onSelect(row.id),
                        ...(row.id === part.selected?.id ? { state: "informative" as const } : {}),
                    }))}
                />
            }
            primary={
                part.selected === undefined ? null : (
                    <ScenarioDetail
                        part={part}
                        scenario={part.selected}
                        labels={labels}
                        connectHref={props.connectHref}
                        onGuard={props.onGuard}
                        onReveal={props.onReveal}
                        onCopy={props.onCopy}
                    />
                )
            }
        />
    )
}
