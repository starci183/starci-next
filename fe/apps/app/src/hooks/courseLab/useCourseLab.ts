"use client"

import { useCallback, useEffect, useState } from "react"
import { RELAY_INSTALL_COMMAND, type LabBenchTab, type LabOsId } from "@starci-next/ui"
import { useSession } from "@/hooks/auth"
import { mapSlot, slotOfSwr } from "@/hooks/slot"
import {
    useMutateIssueRelayPairCodeSwr,
    useMutateRunCourseLabTestsSwr,
    useMutateSetCourseLabChaosSwr,
    useMutateStartCourseLabSwr,
    useMutateSubmitCourseLabSwr,
    useQueryCourseCasesSwr,
    useQueryCourseLabSwr,
    useQueryRelayDevicesSwr,
    type IssuedRelayPairCode,
} from "@/hooks/swr"
import {
    UNREAD_LAB_STATE,
    bodyOf,
    defaultDirOf,
    deviceOf,
    isDirValid,
    noticeOf,
    onlineMachineOf,
    placeholderBodyOf,
    stateOf,
    type CourseLabRead,
    type CourseLabStage,
    type CourseLabState,
} from "@/modules/course-lab"
import type { CourseLabParams, CourseLabPanelView, CourseLabScreen } from "./courseLab.shared"
import { useCourseLabLabels } from "./useCourseLabLabels"

/** How long a command waits for the machine to sync before the panel stops showing it as in flight. */
const REQUEST_WAIT_MS = 90_000

/** A command sent to the machine and what the panel shows until the machine syncs again. */
type Requested = {
    /** The `lastSyncedAt` of the read when the command went out; a newer sync is the machine answering. */
    readonly syncedAt: string
    /** What was asked: to start the lab, to fetch the NestJS version, or anything else (tests, chaos, grading). */
    readonly kind: "start" | "framework" | "other"
}

/** The placeholder of the first read of a stage, drawn once. */
const PLACEHOLDERS: Readonly<Record<CourseLabStage, CourseLabPanelView>> = {
    setup: { body: placeholderBodyOf("setup"), notice: undefined },
    work: { body: placeholderBodyOf("work"), notice: undefined },
    submit: { body: placeholderBodyOf("submit"), notice: undefined },
}

/**
 * The lab of one lesson as the learner's machine last synced it, for the part a page shows (`stage`): the read (polled while the machine
 * boots or a command is in flight), the commands (boot in the folder the learner typed, tests, chaos, submit, the NestJS version, a new
 * pairing code), the words and the summary the page gates on. The machine does the work; every command asks it through the relay and the
 * result comes back by the next read.
 */
export const useCourseLab = (params: CourseLabParams): CourseLabScreen => {
    const { courseId, lessonId, stage } = params
    const labels = useCourseLabLabels()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const [requested, setRequested] = useState<Requested | undefined>(undefined)
    const [failure, setFailure] = useState<unknown>(undefined)
    const [chosenPath, setChosenPath] = useState("")
    const [tab, setTab] = useState<LabBenchTab>("case")
    const [os, setOs] = useState<LabOsId>("windows")
    const [typedDir, setTypedDir] = useState<string | undefined>(undefined)
    const [code, setCode] = useState<IssuedRelayPairCode | undefined>(undefined)
    const [hasIssueFailed, setHasIssueFailed] = useState(false)
    const read = useQueryCourseLabSwr(
        courseId,
        lessonId,
        isSignedIn && courseId !== "" && lessonId !== "",
        requested !== undefined,
    )
    const devices = useQueryRelayDevicesSwr(isSignedIn)
    // The submit gate reads the case states, the same ones the loop pages show and the server checks.
    const cases = useQueryCourseCasesSwr(lessonId, isSignedIn && lessonId !== "", false).data?.cases
    const starter = useMutateStartCourseLabSwr()
    const tester = useMutateRunCourseLabTestsSwr()
    const switcher = useMutateSetCourseLabChaosSwr()
    const submitter = useMutateSubmitCourseLabSwr()
    const issuer = useMutateIssueRelayPairCodeSwr()
    const lab = read.data
    const syncedAt = lab?.lastSyncedAt ?? ""
    const dir = typedDir ?? defaultDirOf(courseId, lessonId)
    const { mutate } = read
    const { trigger: triggerStart } = starter
    const { trigger: triggerIssue } = issuer

    // The machine answering (a newer sync) ends the in-flight state; so does a wait that went past what a boot takes.
    useEffect(() => {
        if (requested !== undefined && lab !== undefined && syncedAt !== requested.syncedAt) setRequested(undefined)
    }, [lab, requested, syncedAt])
    useEffect(() => {
        if (requested === undefined) return undefined
        const timer = setTimeout(() => setRequested(undefined), REQUEST_WAIT_MS)
        return () => clearTimeout(timer)
    }, [requested])

    /** Sends one command to the machine; a refusal becomes the notice, a success reads the lab again at once. */
    const send = useCallback(
        (kind: Requested["kind"], run: () => Promise<unknown>): void => {
            setFailure(undefined)
            setRequested({ kind, syncedAt })
            run()
                .then(() => mutate())
                .catch((error: unknown) => {
                    setFailure(error)
                    setRequested(undefined)
                })
        },
        [mutate, syncedAt],
    )
    const ids = { courseId, lessonId }
    /** Boots the lab; `folder` is the folder the learner typed, left out when the machine already holds the lab's folder. */
    const start = useCallback(
        (kind: Requested["kind"], folder: string | undefined): void =>
            send(kind, () => triggerStart({ courseId, lessonId, dir: folder ?? null })),
        [send, triggerStart, courseId, lessonId],
    )

    // A learner with no machine gets a pairing code to type on the setup page; it is issued again when it expires.
    const isUnpaired = stage === "setup" && lab !== undefined && deviceOf(lab) === "none"
    const issue = useCallback((): void => {
        setHasIssueFailed(false)
        triggerIssue()
            .then(setCode)
            .catch(() => setHasIssueFailed(true))
    }, [triggerIssue])
    useEffect(() => {
        if (isUnpaired && code === undefined && !hasIssueFailed && !issuer.isMutating) issue()
    }, [isUnpaired, code, hasIssueFailed, issuer.isMutating, issue])
    useEffect(() => {
        if (code === undefined) return undefined
        const timer = setTimeout(() => setCode(undefined), Math.max(Date.parse(code.expiresAt) - Date.now(), 0))
        return () => clearTimeout(timer)
    }, [code])

    const view = (each: CourseLabRead): CourseLabPanelView => ({
        body: bodyOf(
            stage,
            each,
            {
                words: labels.words,
                machine: onlineMachineOf(devices.data),
                faulty: params.faulty,
                caseResult: params.caseResult,
                chosenPath,
                tab,
                dir,
                isStartRequested: requested?.kind === "start",
                isFrameworkRequested: requested?.kind === "framework",
                isSubmitting: submitter.isMutating,
                cases,
            },
            {
                os,
                installCommand: RELAY_INSTALL_COMMAND,
                pairCommand: code === undefined ? "" : `starci-relay pair ${code.code}`,
                isIssuing: issuer.isMutating,
            },
        ),
        notice: noticeOf({ failure, lab: each, notices: labels.words.notices }),
    })
    const slot = mapSlot(
        slotOfSwr<CourseLabRead>({
            data: lab,
            error: read.error,
            isLoading: read.isLoading,
            isValidating: read.isValidating,
        }),
        view,
    )
    return {
        props: { lab: slot, placeholder: PLACEHOLDERS[stage], labels },
        on: {
            selectOs: setOs,
            newCode: issue,
            changeDir: setTypedDir,
            startLab: () => start("start", isDirValid(dir) ? dir.trim() : defaultDirOf(courseId, lessonId)),
            selectFile: setChosenPath,
            selectTab: setTab,
            submit: () =>
                send("other", () =>
                    submitter.trigger({
                        ...ids,
                        hintsOpened: params.hintsOpened,
                        timeSpentMs: Math.round(params.timeSpentMs),
                    }),
                ),
            // The NestJS version travels with the next manifest the relay sends, so fetching it asks the machine for one, in the folder it already holds.
            downloadFramework: () => start("framework", undefined),
            notice: (action) => {
                if (action === "reconnect") start("other", undefined)
                if (action === "newCode") issue()
            },
            retry: () => void read.mutate(),
            runTests: () => send("other", () => tester.trigger(ids)),
            setChaos: (chaosIds) => send("other", () => switcher.trigger({ ...ids, chaosIds: [...chaosIds] })),
        },
        labState: lab === undefined ? UNREAD_LAB_STATE : stateOf(lab, cases),
    }
}

/**
 * The summary of the lab a lesson page gates on (is a machine paired, how far the lab is, is every visible test green), read from the
 * same lab read as the panel, so the page and the panel never disagree and no second request is made.
 */
export const useCourseLabState = (courseId: string, lessonId: string): CourseLabState => {
    const session = useSession()
    const isEnabled = session.status === "signed-in" && courseId !== "" && lessonId !== ""
    const read = useQueryCourseLabSwr(courseId, lessonId, isEnabled, false)
    const cases = useQueryCourseCasesSwr(lessonId, isEnabled, false).data?.cases
    return read.data === undefined ? UNREAD_LAB_STATE : stateOf(read.data, cases)
}
