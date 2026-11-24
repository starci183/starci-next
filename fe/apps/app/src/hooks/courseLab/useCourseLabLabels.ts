"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
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

/** The reject reasons of a submission the panel words one by one; every other reason shares one sentence. */
type RejectKey = "deviceKeyMissing" | "commitInvalid" | "timedOut" | "superseded" | "other"

/** The sentence key of a stable reject reason. */
const rejectKeyOf = (reason: string | null): RejectKey => {
    if (reason === "device-key-missing") return "deviceKeyMissing"
    if (reason === "commit-invalid") return "commitInvalid"
    if (reason === "timed-out") return "timedOut"
    return reason === "superseded" ? "superseded" : "other"
}

/** Resolves every word of the lab block once: the panel labels, the words of the builders and the status copy. */
export const useCourseLabLabels = (): CourseLabLabels => {
    const t = useTranslations("app.courseLab")
    const format = useFormatter()
    const locale = useLocale()
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
        locale: locale === "vi" ? "vi" : "en",
        stage: (id) => {
            if (id === "machine") return t("boot.stage.machine")
            if (id === "clone") return t("boot.stage.clone")
            if (id === "compose") return t("boot.stage.compose")
            return id === "seed" ? t("boot.stage.seed") : t("boot.stage.firstRun")
        },
        duration: (ms) => t("boot.duration", { seconds: format.number(ms / 1000, { maximumFractionDigits: 1 }) }),
        testState: (state) => {
            if (state === "passed") return t("work.testState.passed")
            return state === "failed" ? t("work.testState.failed") : t("work.testState.notRun")
        },
        testsSummary: (passed, total) => t("work.testsSummary", { passed, total }),
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
                return key === "superseded" ? t("submit.reject.superseded") : t("submit.reject.other")
            },
        },
        notices,
    }
    const panel: LessonLabLabels = {
        setup: {
            title: t("setup.title"),
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
            doneStep: t("setup.doneStep"),
            waiting: t("setup.waiting"),
            copy: t("setup.copy"),
            copied: t("setup.copied"),
            copyFailed: t("setup.copyFailed"),
        },
        boot: {
            title: (machine) => (machine === "" ? t("boot.titleNoMachine") : t("boot.title", { machine })),
            firstTime: t("boot.firstTime"),
        },
        work: {
            services: (count) => t("work.services", { count }),
            chaos: t("work.chaos"),
            run: t("work.run"),
            running: t("work.running"),
            files: t("work.files"),
            readOnly: t("work.readOnly"),
            omitted: t("work.omitted"),
            noFile: t("work.noFile"),
            benchTabs: t("work.benchTabs"),
            tests: t("work.tests"),
            logs: t("work.logs"),
            testsEmpty: t("work.testsEmpty"),
            logsEmpty: t("work.logsEmpty"),
            lastSynced: (time) => t("work.lastSynced", { time }),
            codeCopy: t("work.codeCopy"),
            codeCopied: t("work.codeCopied"),
            codeCopyFailed: t("work.codeCopyFailed"),
        },
        submit: {
            submit: t("submit.submit"),
            graded: t("submit.graded"),
            failedHidden: t("submit.failedHidden"),
            solution: t("submit.solution"),
        },
    }
    return {
        panel,
        words,
        slot: slotLabels(t("slot.empty")),
        upgrade: t("slot.upgrade"),
        plansHref: APP_ROUTES.premium,
    }
}
