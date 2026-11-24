import {
    Alert,
    Badge,
    Button,
    Cluster,
    FencedCodeBlock,
    Link,
    Section,
    Stack,
    Switch,
    Terminal,
    Text,
} from "@starci/grammar/common"
import { NoMachineNotice } from "../NoMachineNotice"
import { RichMarkdown } from "../RichMarkdown"
import type { ScenarioDetailView, ScenarioHintView, ScenariosLabels, ScenariosPartView } from "./types"

/** What the machine line needs. */
type MachineLineProps = { readonly machine: string; readonly labels: ScenariosLabels }

/** The online machine as a chip beside the words that say where the result comes from, or the warning that none is online. */
const MachineLine = (props: MachineLineProps) =>
    props.machine === "" ? (
        <NoMachineNotice
            title={props.labels.machineNone}
            note={props.labels.machineNoneNote}
            details={props.labels.machineDetails}
        />
    ) : (
        <Cluster gap="inline">
            <Badge isDot tone="success">
                {props.labels.machineOnline(props.machine)}
            </Badge>
            <Text tone="muted">{props.labels.relayNote}</Text>
        </Cluster>
    )

/** What the verdict needs. */
type VerdictProps = { readonly scenario: ScenarioDetailView; readonly labels: ScenariosLabels }

/** The message after the result: why a red run is red, or the rule a green run kept. */
const Verdict = (props: VerdictProps) => {
    const { scenario, labels } = props
    if (scenario.state === "passed")
        return (
            <Alert
                tone="affirmative"
                title={labels.kept}
                description={scenario.ruleText === "" ? undefined : scenario.ruleText}
            />
        )
    if (scenario.state !== "failed" && scenario.state !== "guarded") return null
    return (
        <Alert
            tone="negative"
            title={labels.why}
            description={
                <Stack gap="identity">
                    {scenario.why === "" ? null : <Text>{scenario.why}</Text>}
                    {scenario.ruleText === "" ? null : <Text>{`${scenario.ruleText} · ${labels.ruleBroken}`}</Text>}
                </Stack>
            }
        />
    )
}

/** What the hint needs. */
type HintProps = {
    readonly scenarioId: string
    readonly hint: ScenarioHintView
    readonly labels: ScenariosLabels
    readonly onReveal: (scenarioId: string) => void
}

/** The hint: locked until the first red run, open (and noted as help) after. */
const Hint = (props: HintProps) => {
    const { hint, labels } = props
    if (hint.state === "none") return null
    if (hint.state === "locked")
        return (
            <Alert
                tone="neutral"
                title={labels.hintTitle}
                description={labels.hintLocked}
                {...(hint.canReveal
                    ? { action: { label: labels.hintReveal, onAction: () => props.onReveal(props.scenarioId) } }
                    : {})}
            />
        )
    return (
        <Alert
            tone="neutral"
            title={labels.hintTitle}
            description={
                <Stack gap="identity">
                    <Text>{hint.text}</Text>
                    <Text tone="muted">{labels.hintNote}</Text>
                </Stack>
            }
        />
    )
}

/** What the fix block needs. */
type FixProps = {
    readonly scenario: ScenarioDetailView
    readonly labels: ScenariosLabels
    readonly onGuard: (flag: string, isOff: boolean) => void
    readonly onCopy: (text: string) => void
}

/** The fix: the prompt for the AI of the learner and the switch that turns the rule off to see the system break without it. */
const Fix = (props: FixProps) => {
    const { scenario, labels, onGuard, onCopy } = props
    const guard = scenario.guard
    return (
        <Section title={labels.fixTitle} headingLevel={3}>
            <Stack gap="inline">
                <Text tone="muted">{labels.fixNote}</Text>
                {scenario.state === "failed" ? (
                    <FencedCodeBlock
                        code={scenario.fixPrompt}
                        language="text"
                        showLanguage={false}
                        label={labels.fixPrompt}
                        action={
                            <Button variant="border" size="sm" onPress={() => onCopy(scenario.fixPrompt)}>
                                {labels.fixCopy}
                            </Button>
                        }
                    />
                ) : null}
                {guard === undefined ? null : (
                    <Switch
                        label={labels.guardTitle}
                        description={labels.guardNote(guard.flag)}
                        isSelected={guard.isOff}
                        onSelectedChange={(isOff) => onGuard(guard.flag, isOff)}
                    />
                )}
            </Stack>
        </Section>
    )
}

/** What the ask panel needs. */
type AskProps = {
    readonly labels: ScenariosLabels
    readonly connectHref: string
}

/**
 * The Claude of the learner, asked through the StarCi connector: the app hosts no chat, so the panel names the connector and hands
 * over the prompt (the tools my_runs and read_file of the connector show the AI the run and the code).
 */
const AskClaude = (props: AskProps) => (
    <Section title={props.labels.ask.title} headingLevel={3} fact={props.labels.ask.badge}>
        <Stack gap="inline">
            <Text tone="muted">{props.labels.ask.note}</Text>
            <Link href={props.connectHref}>{props.labels.ask.connect}</Link>
        </Stack>
    </Section>
)

/** What the detail needs. */
type ScenarioDetailProps = {
    readonly part: ScenariosPartView
    readonly scenario: ScenarioDetailView
    readonly labels: ScenariosLabels
    readonly connectHref: string
    readonly onGuard: (flag: string, isOff: boolean) => void
    readonly onReveal: (scenarioId: string) => void
    readonly onCopy: (text: string) => void
}

/** The detail of the scenario on screen: machine, fault, live result, verdict, hint, fix and the way to ask the AI of the learner. */
export const ScenarioDetail = (props: ScenarioDetailProps) => {
    const { scenario, labels } = props
    const emptyLine = scenario.state === "running" ? scenario.stateLabel : labels.noRun
    const lines = [`$ ${scenario.command}`, ...(scenario.output.length === 0 ? [emptyLine] : scenario.output)]
    const isRed = scenario.state === "failed" || scenario.state === "guarded"
    return (
        <Stack gap="section">
            <Section title={scenario.title} headingLevel={2} fact={scenario.stateLabel} id={`scenario-${scenario.id}`}>
                <Stack gap="inline">
                    <RichMarkdown source={scenario.fault} labels={labels.markdown} />
                    <MachineLine machine={props.part.machine} labels={labels} />
                    <Terminal label={scenario.title} lines={lines} />
                    <Verdict scenario={scenario} labels={labels} />
                    <Hint scenarioId={scenario.id} hint={scenario.hint} labels={labels} onReveal={props.onReveal} />
                </Stack>
            </Section>
            {isRed || scenario.guard !== undefined ? (
                <Fix scenario={scenario} labels={labels} onGuard={props.onGuard} onCopy={props.onCopy} />
            ) : null}
            {scenario.state === "failed" ? <AskClaude labels={labels} connectHref={props.connectHref} /> : null}
        </Stack>
    )
}
