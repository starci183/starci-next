import {
    Button,
    Cluster,
    CodeBlock,
    EmptyNotice,
    Grid,
    Section,
    Select,
    Stack,
    Switch,
    Tabs,
    Terminal,
    Text,
} from "@starci/grammar/common"
import type { LabBenchTab, LabTestView, LabWorkLabels, LabWorkView, LessonLabActions } from "./types"

/** What the ready lab needs: the view, the words, whether the page is a phone and what the learner does. */
type LabWorkProps = {
    readonly work: LabWorkView
    readonly labels: LabWorkLabels
    readonly isPhone: boolean
    readonly isLoading: boolean
    readonly on: Pick<LessonLabActions, "selectFile" | "selectTab" | "toggleChaos" | "runTests">
}

/** The badge tone of a test row. */
const testTone = (test: LabTestView) => {
    if (test.state === "done") return "success" as const
    return test.state === "error" ? ("danger" as const) : ("muted" as const)
}

/** The header strip: lab name, branch, the services running, the chaos switches and the command that runs the tests. */
const Header = (props: Pick<LabWorkProps, "work" | "labels" | "isLoading" | "on">) => {
    const { work, labels } = props
    return (
        <Section
            title={work.name}
            headingLevel={2}
            meta={work.branch}
            fact={labels.services(work.services)}
            isLoading={props.isLoading}
            action={
                <Button variant="primary" isPending={work.isRunRequested} onPress={props.on.runTests}>
                    {work.isRunRequested ? labels.running : labels.run}
                </Button>
            }
        >
            <Cluster gap="row" wrap align="center" label={labels.chaos}>
                <Text role="label.item">{labels.chaos}</Text>
                {work.chaos.map((chaos) => (
                    <Cluster key={chaos.id} gap="inline" align="center">
                        <Switch
                            label={chaos.label}
                            isLabelHidden
                            kind="toggle"
                            isSelected={chaos.isOn}
                            onSelectedChange={(isOn) => props.on.toggleChaos(chaos.id, isOn)}
                        />
                        <Text role="body">{chaos.label}</Text>
                    </Cluster>
                ))}
            </Cluster>
        </Section>
    )
}

/** The file on screen as a read-only code block; a file the machine did not send says so. */
const Code = (props: Pick<LabWorkProps, "work" | "labels" | "isLoading">) => {
    const { work, labels } = props
    if (work.code === undefined) return <EmptyNotice mark="none" message={labels.noFile} />
    if (work.code.isOmitted) return <EmptyNotice mark="none" message={labels.omitted} />
    return (
        <CodeBlock
            code={work.code.code}
            language={work.code.language}
            path={work.code.path}
            highlightLines={work.code.highlightLines}
            note={labels.readOnly}
            scheme="dark"
            isLoading={props.isLoading}
            labels={{ copy: labels.codeCopy, copied: labels.codeCopied, copyError: labels.codeCopyFailed }}
        />
    )
}

/** The files of the lab: a list beside the code, a Select above it on a phone. */
const Files = (props: LabWorkProps) => {
    const { work, labels } = props
    const code = <Code work={work} labels={labels} isLoading={props.isLoading} />
    if (props.isPhone)
        return (
            <Stack gap="row">
                <Select
                    label={labels.files}
                    isLabelHidden
                    prefix={labels.files}
                    options={work.files.map((path) => ({ id: path, label: path }))}
                    value={work.selectedPath}
                    isLoading={props.isLoading}
                    onValueChange={(path) => props.on.selectFile(path ?? "")}
                />
                {code}
            </Stack>
        )
    return (
        <Grid
            kind="main-rail"
            railPosition="leading"
            railWidth="medium"
            rail={
                <Section
                    kind="list"
                    title={labels.files}
                    headingLevel={3}
                    count={work.files.length}
                    empty={labels.noFile}
                    isLoading={props.isLoading}
                    items={work.files.map((path) => ({
                        id: path,
                        title: path,
                        onPress: () => props.on.selectFile(path),
                        ...(path === work.selectedPath ? { state: "informative" as const } : {}),
                    }))}
                />
            }
            primary={code}
        />
    )
}

/** The tests of the last run: a row per test with its result, duration and, when red, the failure message. */
const Tests = (props: Pick<LabWorkProps, "work" | "labels" | "isLoading">) => (
    <Section
        kind="list"
        title={props.labels.tests}
        headingLevel={3}
        fact={props.work.testsSummary}
        empty={props.labels.testsEmpty}
        isLoading={props.isLoading}
        items={props.work.tests.map((test) => ({
            id: test.id,
            title: test.name,
            ...(test.message === "" ? {} : { description: test.message }),
            value: test.duration,
            badges: [{ label: test.stateLabel, tone: testTone(test) }] as const,
        }))}
    />
)

/** The last lines of each service. */
const Logs = (props: Pick<LabWorkProps, "work" | "labels">) =>
    props.work.logs.length === 0 ? (
        <EmptyNotice mark="none" message={props.labels.logsEmpty} />
    ) : (
        <Stack gap="row">
            {props.work.logs.map((log) => (
                <Terminal key={log.service} label={log.service} lines={log.lines} />
            ))}
        </Stack>
    )

/** The tab a key names; the key of a tab that does not exist keeps the tests. */
const benchTabOf = (key: string): LabBenchTab => (key === "logs" ? "logs" : "tests")

/** The region tabs under the code: the test results and the service logs. */
const Bench = (props: LabWorkProps) => {
    const { work, labels } = props
    return (
        <Stack gap="row">
            <Tabs
                label={labels.benchTabs}
                selectedKey={work.tab}
                items={[
                    { id: "tests", label: labels.tests },
                    { id: "logs", label: labels.logs },
                ]}
                onSelect={(key) => props.on.selectTab(benchTabOf(key))}
            />
            {work.tab === "logs" ? (
                <Logs work={work} labels={labels} />
            ) : (
                <Tests work={work} labels={labels} isLoading={props.isLoading} />
            )}
        </Stack>
    )
}

/** The ready lab: the header strip, the files with the code, and the tests or logs under them. */
export const LabWork = (props: LabWorkProps) => (
    <Stack gap="section">
        <Header work={props.work} labels={props.labels} isLoading={props.isLoading} on={props.on} />
        <Files {...props} />
        <Bench {...props} />
        {props.work.lastSynced === "" ? null : (
            <Text role="body" tone="muted">
                {props.labels.lastSynced(props.work.lastSynced)}
            </Text>
        )}
    </Stack>
)
