import {
    Alert,
    AlertDialog,
    Badge,
    Button,
    Cluster,
    Grid,
    Page,
    Section,
    Stack,
    type PageHeaderContent,
} from "@starci/grammar/common"
import {
    PracticeEditor,
    PracticeHints,
    PracticeProblemPanel,
    PracticeResult,
    RichMarkdown,
    SlotView,
} from "@starci-next/ui"
import type { PracticeSolveScreen, PracticeSolveView } from "@/hooks/practice"

/** Props for {@link PracticeSolveBase}: the resolved screen of one problem. */
export type PracticeSolveBaseProps = {
    readonly props: PracticeSolveScreen["props"]
    readonly on: PracticeSolveScreen["on"]
}

/** What a piece of the page needs: the screen, the problem and whether it is a skeleton. */
type PieceProps = {
    readonly screen: PracticeSolveBaseProps
    readonly view: PracticeSolveView
    readonly isLoading: boolean
}

/** The commands of the header: run on the examples (neutral) and the one primary command, which follows where the learner stands. */
const HeaderActions = (props: { readonly screen: PracticeSolveBaseProps; readonly view: PracticeSolveView }) => {
    const { labels, state } = props.screen.props
    const { on } = props.screen
    if (props.view.isAccepted && props.view.nextHref !== null && !state.isBusy) {
        return (
            <Button intent="commit" href={props.view.nextHref}>
                {labels.next}
            </Button>
        )
    }
    return (
        <Cluster gap="inline" wrap>
            <Button intent="neutral" isDisabled={state.isBusy || state.code.trim() === ""} onPress={on.run}>
                {labels.run}
            </Button>
            <Button
                intent="commit"
                isPending={state.isBusy}
                isDisabled={state.isBusy || state.code.trim() === ""}
                {...(state.isBusy ? { disabledReason: labels.judging } : {})}
                onPress={on.submit}
            >
                {state.isBusy ? labels.judging : labels.submit}
            </Button>
        </Cluster>
    )
}

/** The page header: the trail, the title, the facts line, the commands and the three tabs. */
const headerOf = (props: PracticeSolveBaseProps, view: PracticeSolveView, isLoading: boolean): PageHeaderContent => {
    const { labels, state, catalogHref } = props.props
    const loadingCrumb = isLoading ? { isLoading: true as const } : {}
    return {
        title: view.title,
        titleScale: "standard",
        meta: view.meta,
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [
                { id: "practice", label: labels.catalog, href: catalogHref },
                { id: "pattern", label: view.patternTitle, href: view.patternHref, ...loadingCrumb },
                { id: "problem", label: view.title, ...loadingCrumb },
            ],
        },
        actions: <HeaderActions screen={props} view={view} />,
        tabs: {
            label: labels.tabsLabel,
            selectedKey: state.tab,
            onSelect: props.on.selectTab,
            items: [
                { id: "problem", label: labels.tabs.problem },
                {
                    id: "submissions",
                    label: labels.tabs.submissions,
                    ...(state.submissionsTotal === 0 ? {} : { count: state.submissionsTotal }),
                },
                { id: "solution", label: labels.tabs.solution },
            ],
        },
    }
}

/** The notice of a run or hint the door refused: a wait for the rate limit, else a plain failure; nothing when it went through. */
const IssueNotice = (props: {
    readonly issue: "none" | "rateLimited" | "other"
    readonly wait: string
    readonly failed: string
}) =>
    props.issue === "none" ? null : (
        <Alert
            tone={props.issue === "rateLimited" ? "cautionary" : "negative"}
            title={props.issue === "rateLimited" ? props.wait : props.failed}
        />
    )

/** The right column of the problem tab: the editor, the result of the last run and the hint ladder. */
const Work = (props: PieceProps) => {
    const { labels, state } = props.screen.props
    const { on } = props.screen
    return (
        <Stack gap="region">
            <PracticeEditor
                labels={{
                    title: labels.editorTitle,
                    language: labels.language,
                    code: labels.code,
                    judgeNote: labels.judgeNote,
                    reset: labels.reset,
                }}
                languages={state.languages}
                language={state.language}
                value={state.code}
                onLanguage={on.language}
                onChange={on.write}
                onReset={on.reset}
                isLoading={props.isLoading}
            />
            <IssueNotice issue={state.issue} wait={labels.rateLimited} failed={labels.failed} />
            <PracticeResult
                state={state.result}
                onSolution={on.openSolution}
                labels={{
                    title: labels.resultTitle,
                    compileOutput: labels.compileOutput,
                    input: labels.input,
                    expected: labels.expected,
                    actual: labels.actual,
                    tests: labels.tests,
                    testsEmpty: labels.testsEmpty,
                    solutionTitle: labels.solutionResultTitle,
                    solutionText: labels.solutionResultText,
                    solutionAction: labels.solutionResultAction,
                }}
            />
        </Stack>
    )
}

/** The hint ladder with the notice of a hint the door refused. */
const Hints = (props: PieceProps) => {
    const { labels, state } = props.screen.props
    const { on } = props.screen
    return (
        <Stack gap="row">
            <PracticeHints
                labels={{
                    title: labels.hintsTitle,
                    note: labels.hintsNote,
                    reveal: labels.hintsReveal,
                    open: labels.hintsOpen,
                    step: labels.hintStep,
                    diagram: labels.diagram,
                    diagramError: labels.diagramError,
                }}
                total={props.view.hintsTotal}
                revealed={state.hints}
                isRevealing={state.isRevealingHint}
                isDisabled={props.isLoading}
                onReveal={on.reveal}
                isLoading={props.isLoading}
            />
            <IssueNotice issue={state.hintIssue} wait={labels.hintFailed} failed={labels.hintFailed} />
        </Stack>
    )
}

/** The statement beside the work: two columns at the desktop width; the work column holds the editor, the result and the hints, so a phone reads statement, code, result, hints. */
const ProblemTab = (props: PieceProps) => {
    const { labels } = props.screen.props
    return (
        <Grid
            kind="pair"
            leading={
                <PracticeProblemPanel
                    markdown={props.view.markdown}
                    examples={props.view.examples}
                    isLoading={props.isLoading}
                    labels={{
                        title: labels.problemTitle,
                        examples: labels.examples,
                        input: labels.input,
                        output: labels.output,
                        diagram: labels.diagram,
                        diagramError: labels.diagramError,
                    }}
                />
            }
            trailing={
                <Stack gap="region">
                    <Work {...props} />
                    <Hints {...props} />
                </Stack>
            }
        />
    )
}

/** The submissions of this visit as one flat list. */
const SubmissionsTab = (props: PieceProps) => {
    const { labels, state } = props.screen.props
    return (
        <Section
            kind="list"
            title={labels.submissionsTitle}
            headingLevel={2}
            isLoading={props.isLoading}
            items={state.submissions.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.meta,
                badges: [{ label: row.verdict, tone: row.isAccepted ? ("success" as const) : ("danger" as const) }],
            }))}
            empty={labels.submissionsEmpty}
            {...(state.hasMoreSubmissions
                ? {
                      action: (
                          <Button
                              intent="neutral"
                              isPending={state.isLoadingMoreSubmissions}
                              onPress={props.screen.on.moreSubmissions}
                          >
                              {labels.submissionsMore}
                          </Button>
                      ),
                  }
                : {})}
        />
    )
}

/** The reference solution: offered with a plain command, or written out once the learner asked for it. */
const SolutionTab = (props: PieceProps) => {
    const { labels, state } = props.screen.props
    return (
        <Section title={labels.solutionTitle} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="inline">
                {state.solution === null ? (
                    <>
                        <Alert tone="neutral" title={labels.solutionText} />
                        <Cluster gap="identity">
                            <Button
                                intent="neutral"
                                isPending={state.isSolutionPending}
                                onPress={props.screen.on.openSolution}
                            >
                                {labels.solutionAction}
                            </Button>
                        </Cluster>
                    </>
                ) : (
                    <>
                        <Badge tone="muted">{labels.solutionSeenNote}</Badge>
                        <RichMarkdown
                            source={state.solution}
                            labels={{ diagram: labels.diagram, diagramError: labels.diagramError }}
                        />
                    </>
                )}
                {state.isSolutionFailed ? <Alert tone="negative" title={labels.solutionFailed} /> : null}
            </Stack>
        </Section>
    )
}

/**
 * Draws the solve page: the header with the trail, the facts, the run and submit commands and the three tabs; the problem tab holds the
 * statement beside the editor, the result and the hint ladder. Viewing the solution before an accepted answer asks first.
 */
export const PracticeSolveBase = (props: PracticeSolveBaseProps) => {
    const { slot, placeholder, labels, state } = props.props
    const fallback: PageHeaderContent = {
        title: labels.loadFailedCrumb,
        titleScale: "standard",
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [{ id: "practice", label: labels.catalog, href: props.props.catalogHref }],
        },
    }
    return (
        <SlotView<PracticeSolveView, PageHeaderContent>
            slot={slot}
            placeholder={placeholder}
            labels={props.props.slotLabels}
            errorDescription={labels.loadFailedNote}
            onRetry={props.on.retry}
            header={(view, loading) => headerOf(props, view, loading)}
            headerFallback={fallback}
            frame={({ header, isLoading, body }) => (
                <Page header={header} isLoading={isLoading}>
                    {body}
                    <AlertDialog
                        title={labels.confirmTitle}
                        description={state.confirmText}
                        tone="cautionary"
                        confirmLabel={labels.confirmAction}
                        cancelLabel={labels.confirmCancel}
                        isOpen={state.isConfirmOpen}
                        onOpenChange={(isOpen) => {
                            if (!isOpen) props.on.cancelSolution()
                        }}
                        onConfirm={props.on.confirmSolution}
                        onCancel={props.on.cancelSolution}
                    />
                </Page>
            )}
            render={(each, isLoading) => {
                const piece: PieceProps = { screen: props, view: each, isLoading }
                if (state.tab === "submissions") return <SubmissionsTab {...piece} />
                return state.tab === "solution" ? <SolutionTab {...piece} /> : <ProblemTab {...piece} />
            }}
        />
    )
}
