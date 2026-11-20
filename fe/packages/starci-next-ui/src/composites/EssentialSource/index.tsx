import {
    Alert,
    Badge,
    Button,
    Cluster,
    DataTable,
    FencedCodeBlock,
    MermaidDiagram,
    Section,
    Stack,
    Terminal,
    Text,
} from "@starci/grammar/common"
import { HighlightedCode } from "../../branches/HighlightedCode"
import type { CodeWalkView, SourceLabels, SourceMachineView, SourcePartView } from "./types"

export type {
    CodeWalkView,
    ComponentRowView,
    SourceAsideLabels,
    SourceFileView,
    SourceLabels,
    SourceMachineView,
    SourcePartView,
} from "./types"

/** What the machine line needs. */
type MachineLineProps = { readonly machine: SourceMachineView; readonly labels: SourceLabels }

/** The machine line: the online machine as a chip, or the warning that none is connected yet. */
const MachineLine = (props: MachineLineProps) =>
    props.machine.isOnline ? (
        <Cluster gap="identity">
            <Badge isDot tone="success">
                {props.labels.machineOnline(props.machine.name)}
            </Badge>
        </Cluster>
    ) : (
        <Alert tone="cautionary" title={props.labels.machineNone} description={props.labels.machineNoneNote} />
    )

/** What one entry of the code walk needs. */
type WalkEntryProps = { readonly entry: CodeWalkView; readonly why: string }

/** One entry of the code walk: where the snippet lives, the rule it keeps, the snippet and why it keeps it. */
const WalkEntry = (props: WalkEntryProps) => (
    <Section title={props.entry.title} headingLevel={3} fact={props.entry.location}>
        <Stack gap="inline">
            {props.entry.rule === "" ? null : <Text tone="muted">{props.entry.rule}</Text>}
            <HighlightedCode code={props.entry.snippet} language="typescript" />
            {props.entry.why === "" ? null : <Text>{`${props.why}: ${props.entry.why}`}</Text>}
        </Stack>
    </Section>
)

/** What the source part needs. */
type EssentialSourceProps = {
    readonly source: SourcePartView
    readonly labels: SourceLabels
    readonly isLoading?: boolean
    /** Copies the commands to the clipboard of the learner. */
    readonly onCopy: (text: string) => void
}

/**
 * Source: the machine that will pull, the commands that pull and start the lesson source (TypeScript), the architecture with the
 * rule each component keeps, then the code walk: each snippet equal to the repository, tagged with its rule and its `file:line`.
 */
export const EssentialSource = (props: EssentialSourceProps) => {
    const { source, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="region">
            <Section title={labels.pullTitle} headingLevel={2} isLoading={isLoading}>
                <Stack gap="inline">
                    <MachineLine machine={source.machine} labels={labels} />
                    <Text tone="muted">{labels.pullNote}</Text>
                    <FencedCodeBlock
                        code={source.pullCommand}
                        language="bash"
                        showLanguage={false}
                        label={labels.pullTitle}
                        action={
                            <Button intent="neutral" size="sm" onPress={() => props.onCopy(source.pullCommand)}>
                                {labels.copy}
                            </Button>
                        }
                    />
                    {source.upFailure.length === 0 ? null : (
                        <>
                            <Terminal title={labels.upFailed} lines={source.upFailure} />
                            <Text tone="muted">{labels.upFix}</Text>
                        </>
                    )}
                </Stack>
            </Section>
            {source.diagram === "" ? null : (
                <Section title={labels.architecture} headingLevel={2} isLoading={isLoading}>
                    <MermaidDiagram source={source.diagram} label={labels.diagram} errorTitle={labels.diagramError} />
                </Section>
            )}
            {source.components.length === 0 ? null : (
                <Section title={labels.components} headingLevel={2} isLoading={isLoading}>
                    <DataTable
                        label={labels.components}
                        rows={source.components}
                        columns={[
                            { id: "name", label: labels.component, isRowHeader: true, width: "fit" },
                            { id: "port", label: labels.port, width: "fit" },
                            { id: "rules", label: labels.rules, width: "fill" },
                        ]}
                        renderCell={(row, columnId) => {
                            if (columnId === "port") return row.port
                            if (columnId === "rules") return row.rules
                            return row.name
                        }}
                        emptyContent={labels.empty}
                    />
                </Section>
            )}
            {source.codeWalk.length === 0 ? null : (
                <Stack gap="section">
                    {source.codeWalk.map((entry) => (
                        <WalkEntry key={entry.id} entry={entry} why={labels.why} />
                    ))}
                </Stack>
            )}
        </Stack>
    )
}

/** What the download command needs. */
type EssentialSourceDownloadProps = { readonly href: string; readonly label: string }

/** The primary command of the source part: the archive of the source, the other way to pull it. */
export const EssentialSourceDownload = (props: EssentialSourceDownloadProps) =>
    props.href === "" ? null : (
        <Button intent="commit" href={props.href}>
            {props.label}
        </Button>
    )
export { EssentialSourceAside } from "./Aside"
