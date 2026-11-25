import { Alert, EmptyNotice, Stack } from "@starci/grammar/common"
import { LabSetup } from "./Setup"
import { LabSubmit } from "./Submit"
import { LabWork } from "./Work"
import type { LabBody, LabNoticeView, LessonLabActions, LessonLabLabels } from "./types"

export type {
    LabBenchTab,
    LabBody,
    LabBootLabels,
    LabBootView,
    LabCaseLabels,
    LabCaseResultView,
    LabCaseState,
    LabCodeView,
    LabLogView,
    LabMatrixCellView,
    LabMatrixRowView,
    LabMatrixView,
    LabNoticeAction,
    LabNoticeView,
    LabOsId,
    LabOsLabels,
    LabReadyLabels,
    LabReadyView,
    LabSetupBody,
    LabSetupLabels,
    LabSetupView,
    LabStageView,
    LabSubmissionView,
    LabSubmitBody,
    LabSubmitLabels,
    LabSubmitView,
    LabWaitingBody,
    LabWaitingLabels,
    LabWorkBody,
    LabWorkLabels,
    LabWorkView,
    LessonLabActions,
    LessonLabLabels,
} from "./types"

/** What the lab panel needs: what to draw, the notice above it, the words and what the learner does. */
type LessonLabPanelProps = {
    readonly body: LabBody
    readonly notice: LabNoticeView | undefined
    readonly labels: LessonLabLabels
    readonly isLoading?: boolean
    readonly on: LessonLabActions
}

/** The notice above the lab, with its one button: a command or the link to the plans. */
const Notice = (props: { readonly notice: LabNoticeView; readonly on: LessonLabActions }) => {
    const { notice, on } = props
    const action = notice.action
    return (
        <Alert
            tone={notice.tone}
            title={notice.title}
            description={notice.description}
            {...(action === undefined
                ? {}
                : {
                      action:
                          action.href === undefined
                              ? { label: action.label, onAction: () => on.notice(action.id) }
                              : { label: action.label, href: action.href },
                  })}
        />
    )
}

/** The part of the lab the body names. */
const Body = (props: Pick<LessonLabPanelProps, "body" | "labels" | "on"> & { readonly isLoading: boolean }) => {
    const { body, labels } = props
    if (body.shape === "setup")
        return (
            <LabSetup
                setup={body.setup}
                boot={body.boot}
                ready={body.ready}
                labels={labels.setup}
                bootLabels={labels.boot}
                readyLabels={labels.ready}
                isLoading={props.isLoading}
                on={props.on}
            />
        )
    if (body.shape === "work")
        return <LabWork work={body.work} labels={labels.work} isLoading={props.isLoading} on={props.on} />
    if (body.shape === "submit")
        return (
            <LabSubmit
                matrix={body.matrix}
                submit={body.submit}
                submission={body.submission}
                labels={labels.submit}
                on={props.on}
            />
        )
    return <EmptyNotice mark="none" message={labels.waiting.title} description={labels.waiting.text} />
}

/**
 * The lab panel, one body for each place a lesson page mounts it: the setup page (OS tabs and the install command, the pairing command
 * with its code, the folder of the lab, then the boot progress), the lab column of the happy and unhappy loops (the ONE learner file as
 * read-only code, the result of the current case the page passes in, the service logs) and the submit page (the hidden matrix, the
 * submission graded on the learner's machine). A lost connection keeps the last synced code under a
 * notice. The body is chosen by its `shape`.
 */
export const LessonLabPanel = (props: LessonLabPanelProps) => (
    <Stack gap="section">
        {props.notice === undefined ? null : <Notice notice={props.notice} on={props.on} />}
        <Body body={props.body} labels={props.labels} on={props.on} isLoading={props.isLoading === true} />
    </Stack>
)
