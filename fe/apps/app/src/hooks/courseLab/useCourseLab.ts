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
    useQueryCourseLabSwr,
    useQueryRelayDevicesSwr,
    type IssuedRelayPairCode,
} from "@/hooks/swr"
import {
    UNREAD_LAB_STATE,
    bodyOf,
    deviceOf,
    noticeOf,
    phaseOf,
    placeholderBodyOf,
    stateOf,
    type CourseLabRead,
    type CourseLabState,
} from "@/modules/course-lab"
import { onlineMachineOf } from "@/modules/essential-runs"
import type { CourseLabParams, CourseLabPanelView, CourseLabScreen } from "./courseLab.shared"
import { useCourseLabLabels } from "./useCourseLabLabels"

/** How long a command waits for the machine to sync before the panel stops showing it as in flight. */
const REQUEST_WAIT_MS = 90_000

/** A command sent to the machine and what the panel shows until the machine syncs again. */
type Requested = {
    /** The `lastSyncedAt` of the read when the command went out; a newer sync is the machine answering. */
    readonly syncedAt: string
    /** True for a test run: the run command shows its pending state. */
    readonly isTestRun: boolean
    /** The chaos switches the learner just set, shown until the machine syncs them. */
    readonly chaos: ReadonlyArray<string> | undefined
}

/** The placeholder of the first read, drawn once. */
const PLACEHOLDER: CourseLabPanelView = { body: placeholderBodyOf(), notice: undefined }

/**
 * The lab of one lesson as the learner's machine last synced it: the read (polled while the machine boots or a command is in flight),
 * the commands (boot, tests, chaos, submit, a new pairing code), the words and the summary the page gates on. The machine does the work;
 * every command asks it through the relay and the result comes back by the next read.
 */
export const useCourseLab = (params: CourseLabParams): CourseLabScreen => {
    const { courseId, lessonId } = params
    const labels = useCourseLabLabels()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const [requested, setRequested] = useState<Requested | undefined>(undefined)
    const [failure, setFailure] = useState<unknown>(undefined)
    const [chosenPath, setChosenPath] = useState("")
    const [tab, setTab] = useState<LabBenchTab>("tests")
    const [os, setOs] = useState<LabOsId>("windows")
    const [code, setCode] = useState<IssuedRelayPairCode | undefined>(undefined)
    const [hasIssueFailed, setHasIssueFailed] = useState(false)
    const [hasAutoStarted, setHasAutoStarted] = useState(false)
    const read = useQueryCourseLabSwr(
        courseId,
        lessonId,
        isSignedIn && courseId !== "" && lessonId !== "",
        requested !== undefined,
    )
    const devices = useQueryRelayDevicesSwr(isSignedIn)
    const starter = useMutateStartCourseLabSwr()
    const tester = useMutateRunCourseLabTestsSwr()
    const switcher = useMutateSetCourseLabChaosSwr()
    const submitter = useMutateSubmitCourseLabSwr()
    const issuer = useMutateIssueRelayPairCodeSwr()
    const lab = read.data
    const syncedAt = lab?.lastSyncedAt ?? ""
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
        (next: Omit<Requested, "syncedAt">, run: () => Promise<unknown>): void => {
            setFailure(undefined)
            setRequested({ ...next, syncedAt })
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
    const start = useCallback(
        (): void => send({ isTestRun: false, chaos: undefined }, () => triggerStart({ courseId, lessonId })),
        [send, triggerStart, courseId, lessonId],
    )

    // A machine that is online and has not started this lab starts it: the learner types no command.
    const shouldStart = lab !== undefined && deviceOf(lab) === "online" && phaseOf(lab) === "setup"
    useEffect(() => {
        if (!shouldStart || hasAutoStarted) return
        setHasAutoStarted(true)
        start()
    }, [shouldStart, hasAutoStarted, start])

    // A learner with no machine gets a pairing code to type; it is issued again when it expires.
    const isUnpaired = lab !== undefined && deviceOf(lab) === "none"
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

    const chaosOf = (each: CourseLabRead): ReadonlyArray<string> => requested?.chaos ?? each.chaosOn
    const view = (each: CourseLabRead): CourseLabPanelView => ({
        body: bodyOf(
            each,
            {
                words: labels.words,
                machine: onlineMachineOf(devices.data),
                faulty: params.faulty,
                chosenPath,
                tab,
                chaosOn: chaosOf(each),
                isTestRequested: requested?.isTestRun === true,
                isSubmitting: submitter.isMutating,
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
        props: { lab: slot, placeholder: PLACEHOLDER, labels },
        on: {
            selectOs: setOs,
            newCode: issue,
            selectFile: setChosenPath,
            selectTab: setTab,
            toggleChaos: (id, isOn) => {
                const current = lab === undefined ? [] : chaosOf(lab)
                const next = isOn
                    ? [...current.filter((each) => each !== id), id]
                    : current.filter((each) => each !== id)
                send({ isTestRun: false, chaos: next }, () => switcher.trigger({ ...ids, chaosIds: [...next] }))
            },
            runTests: () => send({ isTestRun: true, chaos: undefined }, () => tester.trigger(ids)),
            submit: () =>
                send({ isTestRun: false, chaos: undefined }, () =>
                    submitter.trigger({
                        ...ids,
                        hintsOpened: params.hintsOpened,
                        timeSpentMs: Math.round(params.timeSpentMs),
                        designDoc: [...params.designDoc],
                    }),
                ),
            // The solution travels with the next manifest the relay sends, so opening it asks the machine for one.
            openSolution: start,
            notice: (action) => {
                if (action === "reconnect") start()
                if (action === "newCode") issue()
            },
            retry: () => void read.mutate(),
        },
        labState: lab === undefined ? UNREAD_LAB_STATE : stateOf(lab),
    }
}

/**
 * The summary of the lab a lesson page gates on (is a machine paired, how far the lab is, is every visible test green), read from the
 * same lab read as the panel, so the page and the panel never disagree and no second request is made.
 */
export const useCourseLabState = (courseId: string, lessonId: string): CourseLabState => {
    const session = useSession()
    const read = useQueryCourseLabSwr(
        courseId,
        lessonId,
        session.status === "signed-in" && courseId !== "" && lessonId !== "",
        false,
    )
    return read.data === undefined ? UNREAD_LAB_STATE : stateOf(read.data)
}
