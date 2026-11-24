import {
    Alert,
    CodeBlock,
    DescriptionList,
    EmptyNotice,
    InlineStatus,
    Section,
    Select,
    Stack,
    Tabs,
    Terminal,
    Text,
    type MarkState,
} from "@starci/grammar/common"
import type {
    LabBenchTab,
    LabCaseLabels,
    LabCaseResultView,
    LabCaseState,
    LabWorkLabels,
    LabWorkView,
    LessonLabActions,
} from "./types"

/** What the lab column needs: the view, the words and what the learner does. */
type LabWorkProps = {
    readonly work: LabWorkView
    readonly labels: LabWorkLabels
    readonly isLoading: boolean
    readonly on: Pick<LessonLabActions, "selectFile" | "selectTab">
}

/** The status mark each case state draws. */
const MARK_OF: Readonly<Record<LabCaseState, MarkState>> = {
    notRun: "notRun",
    running: "running",
    passed: "done",
    failed: "error",
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
            note={work.code.isLearnerFile ? labels.learnerFile : labels.otherFile}
            scheme="dark"
            isLoading={props.isLoading}
            labels={{ copy: labels.codeCopy, copied: labels.codeCopied, copyError: labels.codeCopyFailed }}
        />
    )
}

/** The synced files to pick from, above the code. */
const Files = (props: LabWorkProps) => (
    <Stack gap="row">
        <Select
            label={props.labels.files}
            isLabelHidden
            prefix={props.labels.files}
            options={props.work.files.map((path) => ({ id: path, label: path }))}
            value={props.work.selectedPath}
            isLoading={props.isLoading}
            onValueChange={(path) => props.on.selectFile(path ?? "")}
        />
        <Code work={props.work} labels={props.labels} isLoading={props.isLoading} />
    </Stack>
)

/** The failed invariant of a red case: what it says, what was expected and what was found. */
const Failure = (props: { readonly result: LabCaseResultView; readonly labels: LabCaseLabels }) => (
    <Stack gap="row">
        <Alert tone="negative" title={props.labels.invariant} description={props.result.invariant} />
        <DescriptionList
            isDivided
            items={[
                { id: "expected", term: props.labels.expected, description: props.result.expected },
                { id: "actual", term: props.labels.actual, description: props.result.actual },
            ]}
        />
    </Stack>
)

/** The result of the current case the page passes in: its state in words and, when red, the invariant that failed. */
const CaseResult = (props: { readonly result: LabCaseResultView | undefined; readonly labels: LabCaseLabels }) => {
    const { result, labels } = props
    if (result === undefined) return <EmptyNotice mark="none" message={labels.none} />
    return (
        <Section title={result.title === "" ? labels.title : result.title} headingLevel={3}>
            <Stack gap="row">
                <InlineStatus state={MARK_OF[result.state]} label={result.stateLabel} />
                {result.state === "failed" ? <Failure result={result} labels={labels} /> : null}
                {result.state === "notRun" ? (
                    <Text role="body" tone="muted">
                        {labels.notRun}
                    </Text>
                ) : null}
            </Stack>
        </Section>
    )
}

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

/** The tab a key names; the key of a tab that does not exist keeps the case. */
const benchTabOf = (key: string): LabBenchTab => (key === "logs" ? "logs" : "case")

/** The region tabs under the code: the result of the current case and the service logs. */
const Bench = (props: LabWorkProps) => {
    const { work, labels } = props
    return (
        <Stack gap="row">
            <Tabs
                label={labels.benchTabs}
                selectedKey={work.tab}
                items={[
                    { id: "case", label: labels.caseTab },
                    { id: "logs", label: labels.logs },
                ]}
                onSelect={(key) => props.on.selectTab(benchTabOf(key))}
            />
            {work.tab === "logs" ? (
                <Logs work={work} labels={labels} />
            ) : (
                <CaseResult result={work.caseResult} labels={labels.case} />
            )}
        </Stack>
    )
}

/**
 * The lab column of a loop page on the learner's machine: the ONE learner file as read-only code (the faulty lines the page marks, the
 * other synced files in the select above it), then the result of the current case or the service logs.
 */
export const LabWork = (props: LabWorkProps) => (
    <Stack gap="section">
        <Files {...props} />
        <Bench {...props} />
        {props.work.lastSynced === "" ? null : (
            <Text role="body" tone="muted">
                {props.labels.lastSynced(props.work.lastSynced)}
            </Text>
        )}
    </Stack>
)
