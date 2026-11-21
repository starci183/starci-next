import { Cluster, Section, Stack, Stepper, SurfaceCard, Text, type StepperStepState } from "@starci/grammar/common"
import type { CardProps } from "../ProjectAside/types"

/** One box of the flow diagram: what happens there and the line under it. */
export type ConnectFlowBox = { readonly title: string; readonly note: string }

/** What the connect panel needs: the project, the words and the four boxes of the flow. */
type ConnectPanelProps = CardProps

/** The step a step of the connect checklist takes: the repo is the first, the first signed run the last; the first not done is the current one. */
const stepStateOf = (index: number, done: number): StepperStepState => {
    if (index < done) return "complete"
    return index === done ? "current" : "upcoming"
}

/**
 * The connect flow of a project that has no signed run yet: the diagram push, GitHub Actions, StarCi, proved, and the four steps
 * (repository, OIDC audience, signing secret, first run) with the one the learner is on marked. The secret itself is in the status tiles.
 */
export const ConnectPanel = (props: ConnectPanelProps) => {
    const { labels, view } = props
    const done = view.repo === "" ? 0 : 2
    return (
        <Section title={labels.connectTitle} headingLevel={2} caption={labels.connectNote} isLoading={props.isLoading}>
            <Stack gap="region">
                <Cluster gap="inline" align="center" wrap>
                    {labels.connectFlow.flatMap((box, index) => [
                        index === 0 ? null : (
                            <Text key={`arrow-${box.title}`} tone="muted">
                                →
                            </Text>
                        ),
                        <SurfaceCard key={box.title} label={box.title} headingLevel={3}>
                            <Text tone="muted">{box.note}</Text>
                        </SurfaceCard>,
                    ])}
                </Cluster>
                <Stepper
                    label={labels.connectTitle}
                    currentStepId={`step-${Math.min(done, labels.connectSteps.length - 1)}`}
                    steps={labels.connectSteps.map((label, index) => ({
                        id: `step-${index}`,
                        label,
                        state: stepStateOf(index, done),
                    }))}
                />
            </Stack>
        </Section>
    )
}
