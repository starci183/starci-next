import {
    Alert,
    Badge,
    Button,
    Cluster,
    Grid,
    Page,
    Stack,
    Stepper,
    SurfaceCard,
    Text,
    type PageHeaderContent,
} from "@starci/grammar/common"
import {
    InterviewChat,
    InterviewComposer,
    InterviewEndDialog,
    InterviewExitLinks,
    InterviewRetryNotice,
    MarkdownBody,
    SlotView,
    type InterviewBubble,
    type MarkdownBlock,
} from "@starci-next/ui"
import type { DataSlot, InterviewRoomLabels, SlotLabels } from "@/modules/types"

/** One question of the progress list. */
export type InterviewProgressView = {
    readonly id: string
    readonly label: string
    readonly description: string
    readonly state: "complete" | "current" | "upcoming" | "paused"
}

/** The room as it is drawn: every word is already resolved. */
export type InterviewRoomView = {
    readonly counter: string
    readonly tier: string
    readonly bubbles: ReadonlyArray<InterviewBubble>
    readonly progress: ReadonlyArray<InterviewProgressView>
    readonly currentId: string
    /** The code or diagram of the open question, as blocks; empty when it has none. */
    readonly material: ReadonlyArray<MarkdownBlock>
    readonly isActive: boolean
    readonly isFinished: boolean
    readonly needsReply: boolean
}

/** The fake room drawn as a skeleton while the first read runs. */
export const INTERVIEW_ROOM_PLACEHOLDER: InterviewRoomView = {
    counter: "xxxxxx",
    tier: "xxxxxx",
    bubbles: [
        { id: "p1", isMine: false, author: "xxxxxx", text: "xxxxxxxxxxxxxxxxxxxx", badge: "" },
        { id: "p2", isMine: true, author: "xxxxxx", text: "xxxxxxxxxxxxxxxxxxxx", badge: "" },
    ],
    progress: [1, 2, 3].map((n) => ({
        id: `p${n}`,
        label: "xxxxxx",
        description: "xxxxxx",
        state: "upcoming" as const,
    })),
    currentId: "none",
    material: [],
    isActive: true,
    isFinished: false,
    needsReply: false,
}

/** What the learner holds in the room. */
export type InterviewRoomState = {
    readonly draft: string
    readonly hintLabel: string
    readonly hintsLeft: number
    readonly answeredCount: number
    /** The words of the refusal of the last step, or empty. */
    readonly issueWords: string
}

/** What the learner does in the room. */
type InterviewRoomActions = {
    readonly retryRead: () => void
    readonly write: (text: string) => void
    readonly send: () => void
    readonly skip: () => void
    readonly hint: () => void
    readonly retry: () => void
    readonly submit: () => void
    readonly abandon: () => void
    readonly openEnd: (isOpen: boolean) => void
}

/** Props for {@link InterviewRoomBase}. */
export type InterviewRoomBaseProps = {
    readonly props: {
        readonly slot: DataSlot<InterviewRoomView>
        readonly placeholder: InterviewRoomView
        readonly slotLabels: SlotLabels
        readonly labels: InterviewRoomLabels
        readonly state: InterviewRoomState
        readonly reportHref: string
        readonly homeHref: string
        readonly header: PageHeaderContent
        readonly isSending: boolean
        readonly isRetrying: boolean
        readonly isHinting: boolean
        readonly isGrading: boolean
        readonly isEndOpen: boolean
        /** True when the refusal means the transcript is saved but the interviewer step is missing. */
        readonly isIssueSaved: boolean
        readonly isNoAnswer: boolean
    }
    readonly on: InterviewRoomActions
}

type BodyProps = {
    readonly view: InterviewRoomView
    readonly isLoading: boolean
    readonly props: InterviewRoomBaseProps["props"]
    readonly on: InterviewRoomActions
}

/** The answer box wired to the room: nothing can be sent while the reply is missing, a step runs or the read runs. */
const Answer = (props: BodyProps) => (
    <InterviewComposer
        labels={props.props.labels}
        draft={props.props.state.draft}
        hintLabel={props.props.state.hintLabel}
        hintsLeft={props.props.state.hintsLeft}
        isSending={props.props.isSending}
        isHinting={props.props.isHinting}
        isBusy={props.props.isSending || props.props.isRetrying || props.view.needsReply || props.isLoading}
        onWrite={props.on.write}
        onSend={props.on.send}
        onHint={props.on.hint}
        onSkip={props.on.skip}
    />
)

/** The header line: the question counter, the tier and the way to end the interview. */
const Header = (props: Omit<BodyProps, "isLoading">) => (
    <Cluster gap="inline" wrap align="center" justify="between">
        <Cluster gap="identity" align="center">
            <Badge tone="accent">{props.view.counter}</Badge>
            <Badge tone="muted">{props.view.tier}</Badge>
        </Cluster>
        {props.view.isActive ? (
            <InterviewEndDialog
                labels={props.props.labels}
                isOpen={props.props.isEndOpen}
                hasAnswer={props.props.state.answeredCount > 0}
                onOpenChange={props.on.openEnd}
                onSubmit={props.on.submit}
                onAbandon={props.on.abandon}
            />
        ) : null}
    </Cluster>
)

/** The step after the last question: send the whole interview to be graded once. */
const Finish = (props: Pick<BodyProps, "props" | "on">) => (
    <SurfaceCard label={props.props.labels.done}>
        <Button intent="commit" onPress={props.on.submit}>
            {props.props.labels.submit}
        </Button>
    </SurfaceCard>
)

/** The way out of a session that no longer takes answers. */
const Closed = (props: Pick<BodyProps, "props">) => (
    <SurfaceCard treatment="soft" label={props.props.labels.closedTitle}>
        <Stack gap="row">
            <Text>{props.props.labels.closedDescription}</Text>
            <InterviewExitLinks
                first={{ label: props.props.labels.openReport, href: props.props.reportHref }}
                firstIntent="neutral"
                second={{ label: props.props.labels.back, href: props.props.homeHref }}
            />
        </Stack>
    </SurfaceCard>
)

/** The primary column: the header line, the conversation, the material to read and either the answer box or the way out. */
const Main = (props: BodyProps) => {
    const { view, props: p } = props
    const isOpen = view.isActive && !p.isGrading
    return (
        <Stack gap="region">
            <Header view={view} props={p} on={props.on} />
            <InterviewChat bubbles={view.bubbles} />
            <InterviewRetryNotice
                labels={p.labels}
                issueWords={p.state.issueWords}
                isIssueSaved={p.isIssueSaved}
                needsReply={view.needsReply}
                isRetrying={p.isRetrying}
                onRetry={props.on.retry}
            />
            {p.isGrading ? (
                <Alert tone="informative" title={p.labels.grading} description={p.labels.gradingNote} />
            ) : null}
            {view.material.length === 0 || !view.isActive ? null : (
                <SurfaceCard label={p.labels.material}>
                    <MarkdownBody
                        blocks={view.material}
                        diagramLabel={p.labels.diagram}
                        diagramErrorTitle={p.labels.diagramError}
                        isLoading={props.isLoading}
                    />
                </SurfaceCard>
            )}
            {p.isNoAnswer ? (
                <Button intent="neutral" onPress={props.on.abandon}>
                    {p.labels.abandonNow}
                </Button>
            ) : null}
            {isOpen && !view.isFinished ? <Answer {...props} /> : null}
            {isOpen && view.isFinished ? <Finish props={p} on={props.on} /> : null}
            {view.isActive ? null : <Closed props={p} />}
        </Stack>
    )
}

type RailProps = {
    readonly view: InterviewRoomView
    readonly isLoading: boolean
    readonly labels: InterviewRoomLabels
}

/** The rail: the questions of the session with where the learner is, and the note on how the interview is graded. */
const Rail = (props: RailProps) => (
    <Stack gap="region">
        <SurfaceCard label={props.labels.progressTitle}>
            <Stepper
                label={props.labels.progressTitle}
                orientation="vertical"
                size="dense"
                steps={props.view.progress.map((step) => ({
                    id: step.id,
                    label: step.label,
                    description: step.description,
                    state: step.state,
                }))}
                currentStepId={props.view.currentId}
                isLoading={props.isLoading}
            />
        </SurfaceCard>
        <SurfaceCard treatment="soft" label={props.labels.title}>
            <Text size="sm">{props.labels.note}</Text>
        </SurfaceCard>
    </Stack>
)

/**
 * The interview room as the canvas draws it: the chat with the counter, the code or diagram above the answer box and the
 * actions below; beside it the progress and the note that answers are judged only once graded. On a phone the rail follows.
 */
export const InterviewRoomBase = (props: InterviewRoomBaseProps) => (
    <Page header={props.props.header}>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retryRead}
            render={(view, isLoading) => (
                <Grid
                    kind="main-rail"
                    railPosition="trailing"
                    primary={<Main view={view} isLoading={isLoading} props={props.props} on={props.on} />}
                    rail={<Rail view={view} isLoading={isLoading} labels={props.props.labels} />}
                />
            )}
        />
    </Page>
)
