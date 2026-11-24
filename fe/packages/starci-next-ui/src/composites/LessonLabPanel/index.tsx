import { Alert, Stack } from "@starci/grammar/common"
import { LabBoot } from "./Boot"
import { LabSetup } from "./Setup"
import { LabSubmit } from "./Submit"
import { LabWork } from "./Work"
import type { LabBody, LabNoticeView, LessonLabActions, LessonLabLabels } from "./types"

export type {
    LabBenchTab,
    LabBody,
    LabBootBody,
    LabBootLabels,
    LabBootView,
    LabChaosView,
    LabCodeView,
    LabLogView,
    LabNoticeAction,
    LabNoticeView,
    LabOsId,
    LabOsLabels,
    LabPairBody,
    LabSetupLabels,
    LabSetupView,
    LabStageView,
    LabSubmissionView,
    LabSubmitLabels,
    LabSubmitView,
    LabTestView,
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
    /** True at phone width: the file list becomes a Select above the code. */
    readonly isPhone: boolean
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

/**
 * The lab panel of the "Sửa" step: with no machine, how to connect one (OS tabs, one install command, the pairing command with its
 * code); while the machine boots, the stages; when ready, the header strip, files with the read-only code, test results and logs, then
 * "Nộp bài". A lost connection keeps the last synced code under a notice. The body is chosen by its `shape`.
 */
export const LessonLabPanel = (props: LessonLabPanelProps) => {
    const { body, labels } = props
    const isLoading = props.isLoading === true
    return (
        <Stack gap="section">
            {props.notice === undefined ? null : <Notice notice={props.notice} on={props.on} />}
            {body.shape === "pair" ? <LabSetup setup={body.setup} labels={labels.setup} on={props.on} /> : null}
            {body.shape === "boot" ? <LabBoot boot={body.boot} labels={labels.boot} isLoading={isLoading} /> : null}
            {body.shape === "work" ? (
                <Stack gap="section">
                    <LabWork
                        work={body.work}
                        labels={labels.work}
                        isPhone={props.isPhone}
                        isLoading={isLoading}
                        on={props.on}
                    />
                    <LabSubmit
                        submit={body.submit}
                        submission={body.submission}
                        hasSolution={body.hasSolution}
                        labels={labels.submit}
                        on={props.on}
                    />
                </Stack>
            ) : null}
        </Stack>
    )
}
