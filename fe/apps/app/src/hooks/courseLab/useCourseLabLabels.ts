"use client"

import { useFormatter, useTranslations } from "next-intl"
import type { LabNoticeView, LessonLabLabels, SlotLabels } from "@starci-next/ui"
import type { CourseLabNotices, CourseLabWords } from "@/modules/course-lab"
import { APP_ROUTES } from "@/modules/routes"
import { useSlotLabels } from "@/hooks/slot"

/** The words of the lab block: what the panel draws, what the builders word, the status of the read and the way out of a lock. */
export type CourseLabLabels = {
    readonly panel: LessonLabLabels
    readonly words: CourseLabWords
    readonly slot: SlotLabels
    /** The words of the button that leads a learner without Premium to the plans. */
    readonly upgrade: string
    /** The destination of that button. */
    readonly plansHref: string
}

/** The steps and faults of the hidden matrix the app has a word for; any other id is shown as it is. */
const STEP_IDS: ReadonlySet<string> = new Set(["order", "payment", "stock"])
const FAULT_IDS: ReadonlySet<string> = new Set(["fail-before", "lost-response", "crash", "dup"])

/** The reject reasons of a submission the panel words one by one; every other reason shares one sentence. */
type RejectKey = "deviceKeyMissing" | "commitInvalid" | "timedOut" | "superseded" | "noReport" | "other"

/** The sentence key of a stable reject reason. */
const rejectKeyOf = (reason: string | null): RejectKey => {
    if (reason === "device-key-missing") return "deviceKeyMissing"
    // The relay refuses to grade uncommitted work and says so; the learner's fix is the same as for a bad commit.
    if (reason === "commit-invalid" || reason === "uncommitted") return "commitInvalid"
    if (reason === "no-readable-report") return "noReport"
    if (reason === "timed-out") return "timedOut"
    return reason === "superseded" ? "superseded" : "other"
}

/** Resolves every word of the lab block once: the panel labels, the words of the builders and the status copy. */
export const useCourseLabLabels = (): CourseLabLabels => {
    const t = useTranslations("app.courseLab")
    const format = useFormatter()
    const slotLabels = useSlotLabels()
    const notice = (
        tone: LabNoticeView["tone"],
        title: string,
        description: string,
        action: LabNoticeView["action"],
    ): LabNoticeView => ({ tone, title, description, action })
    const retry = { id: "reconnect" as const, label: t("notice.retry"), href: undefined }
    const notices: CourseLabNotices = {
        lost: notice("negative", t("notice.lostTitle"), t("notice.lostText"), {
            id: "reconnect",
            label: t("notice.reconnect"),
            href: undefined,
        }),
        offline: notice("cautionary", t("notice.offlineTitle"), t("notice.offlineText"), retry),
        premium: notice("cautionary", t("notice.premiumTitle"), t("notice.premiumText"), {
            id: "link",
            label: t("notice.premiumAction"),
            href: APP_ROUTES.premium,
        }),
        key: notice("cautionary", t("notice.keyTitle"), t("notice.keyText"), {
            id: "link",
            label: t("notice.keyAction"),
            href: APP_ROUTES.devices,
        }),
        running: notice("cautionary", t("notice.runningTitle"), t("notice.runningText"), undefined),
        other: notice("negative", t("notice.otherTitle"), t("notice.otherText"), undefined),
        boot: notice("negative", t("notice.bootTitle"), t("notice.bootText"), retry),
        pair: notice("cautionary", t("notice.pairTitle"), t("notice.pairText"), undefined),
    }
    const words: CourseLabWords = {
        stage: (id) => {
            if (id === "machine") return t("boot.stage.machine")
            if (id === "clone") return t("boot.stage.clone")
            if (id === "compose") return t("boot.stage.compose")
            return id === "seed" ? t("boot.stage.seed") : t("boot.stage.firstRun")
        },
        duration: (ms) => t("boot.duration", { seconds: format.number(ms / 1000, { maximumFractionDigits: 1 }) }),
        caseState: (state) => t(`work.case.state.${state}`),
        step: (id) => (STEP_IDS.has(id) ? t(`matrix.steps.${id}`) : id),
        fault: (id) => (FAULT_IDS.has(id) ? t(`matrix.faults.${id}`) : id),
        cell: (kind) => t(`submit.cell.${kind}`),
        dirInvalid: t("setup.dirInvalid"),
        time: (iso) => format.dateTime(new Date(iso), { timeStyle: "short" }),
        submit: {
            reasonNoRun: t("submit.reasonNoRun"),
            reasonRed: t("submit.reasonRed"),
            reasonLost: t("submit.reasonLost"),
            gradedNote: t("submit.gradedNote"),
            passedTitle: t("submit.passedTitle"),
            failedTitle: t("submit.failedTitle"),
            waitingTitle: t("submit.waitingTitle"),
            waitingNote: t("submit.waitingNote"),
            rejectedTitle: t("submit.rejectedTitle"),
            rejected: (reason) => {
                const key = rejectKeyOf(reason)
                if (key === "deviceKeyMissing") return t("submit.reject.deviceKeyMissing")
                if (key === "commitInvalid") return t("submit.reject.commitInvalid")
                if (key === "timedOut") return t("submit.reject.timedOut")
                if (key === "noReport") return t("submit.reject.noReport")
                return key === "superseded" ? t("submit.reject.superseded") : t("submit.reject.other")
            },
            score: (passed, total) => t("submit.score", { passed, total }),
        },
        notices,
    }
    const panel: LessonLabLabels = {
        setup: {
            title: t("setup.title"),
            machineTitle: t("setup.machineTitle"),
            note: t("setup.note"),
            osTabs: t("setup.osTabs"),
            os: [
                { id: "windows", label: t("setup.os.windows.label"), docker: t("setup.os.windows.docker") },
                { id: "macos", label: t("setup.os.macos.label"), docker: t("setup.os.macos.docker") },
                { id: "linux", label: t("setup.os.linux.label"), docker: t("setup.os.linux.docker") },
            ],
            installStep: t("setup.installStep"),
            pairStep: t("setup.pairStep"),
            codeNote: t("setup.codeNote"),
            newCode: t("setup.newCode"),
            connected: t("setup.connected"),
            notConnected: t("setup.notConnected"),
            waiting: t("setup.waiting"),
            dirStep: t("setup.dirStep"),
            dirLabel: t("setup.dirLabel"),
            dirNote: t("setup.dirNote"),
            start: t("setup.start"),
            starting: t("setup.starting"),
            startReason: t("setup.startReason"),
            startReasonOffline: t("setup.startReasonOffline"),
            copy: t("setup.copy"),
            copied: t("setup.copied"),
            copyFailed: t("setup.copyFailed"),
        },
        boot: {
            title: (machine) => (machine === "" ? t("boot.titleNoMachine") : t("boot.title", { machine })),
            firstTime: t("boot.firstTime"),
            plan: [
                t("boot.stage.machine"),
                t("boot.stage.clone"),
                t("boot.stage.compose"),
                t("boot.stage.seed"),
                t("boot.stage.firstRun"),
            ],
        },
        ready: {
            title: t("ready.title"),
            openFile: (file) => t("ready.openFile", { file }),
            openAny: t("ready.openAny"),
        },
        work: {
            files: t("work.files"),
            learnerFile: t("work.learnerFile"),
            otherFile: t("work.otherFile"),
            omitted: t("work.omitted"),
            noFile: t("work.noFile"),
            benchTabs: t("work.benchTabs"),
            caseTab: t("work.caseTab"),
            logs: t("work.logs"),
            logsEmpty: t("work.logsEmpty"),
            lastSynced: (time) => t("work.lastSynced", { time }),
            codeCopy: t("work.codeCopy"),
            codeCopied: t("work.codeCopied"),
            codeCopyFailed: t("work.codeCopyFailed"),
            case: {
                title: t("work.case.title"),
                none: t("work.case.none"),
                notRun: t("work.case.notRun"),
                invariant: t("work.case.invariant"),
                expected: t("work.case.expected"),
                actual: t("work.case.actual"),
            },
        },
        submit: {
            title: t("submit.title"),
            note: t("submit.note"),
            matrix: t("submit.matrix"),
            step: t("submit.step"),
            submit: t("submit.submit"),
            resubmit: t("submit.resubmit"),
            graded: t("submit.graded"),
            failedHidden: t("submit.failedHidden"),
        },
        waiting: { title: t("waiting.title"), text: t("waiting.text") },
    }
    return {
        panel,
        words,
        slot: slotLabels(t("slot.empty")),
        upgrade: t("slot.upgrade"),
        plansHref: APP_ROUTES.premium,
    }
}
