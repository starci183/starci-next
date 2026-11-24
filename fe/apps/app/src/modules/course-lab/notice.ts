import type { LabNoticeView } from "@starci-next/ui"
import { ApiFailure } from "@/modules/failure"
import { deviceOf, hasBootFailed, phaseOf, type CourseLabRead } from "./lab"
import type { CourseLabNotices } from "./words"

/** The notice each stable relay code of a lab command is worded as. */
const NOTICE_OF_CODE: Readonly<Record<string, keyof CourseLabNotices>> = {
    RELAY_DEVICE_OFFLINE: "offline",
    RELAY_LAB_PREMIUM_REQUIRED: "premium",
    RELAY_DEVICE_KEY_MISSING: "key",
    RELAY_LAB_SUBMISSION_RUNNING: "running",
}

/** The notice of a failed command: its stable code decides the words, never the status. */
export const noticeOfFailure = (failure: unknown, notices: CourseLabNotices): LabNoticeView => {
    const code = failure instanceof ApiFailure ? failure.code : undefined
    const key = code === undefined ? undefined : NOTICE_OF_CODE[code]
    return notices[key ?? "other"]
}

/** What decides the notice above the lab: the last failed command, if any, and the read. */
type NoticeInput = {
    /** The failure of the newest command, or undefined when it went through or none was sent. */
    readonly failure: unknown
    readonly lab: CourseLabRead
    readonly notices: CourseLabNotices
}

/**
 * The one notice above the lab: a refused command first, then a lost connection (the last synced code stays under it), then a failed
 * boot stage, then a paired machine whose relay does not run. A lab that is fine carries none.
 */
export const noticeOf = (input: NoticeInput): LabNoticeView | undefined => {
    const { failure, lab, notices } = input
    if (failure !== undefined) return noticeOfFailure(failure, notices)
    if (lab.connectionLost) return notices.lost
    if (hasBootFailed(lab)) return notices.boot
    return deviceOf(lab) === "offline" && phaseOf(lab) === "setup" ? notices.pair : undefined
}
