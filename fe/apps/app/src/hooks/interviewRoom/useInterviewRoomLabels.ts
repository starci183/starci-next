"use client"

import { useTranslations } from "next-intl"
import type { InterviewRoomLabels } from "@/modules/types"

/** The fixed words of the room, from the catalogue of the active language. */
export const useInterviewRoomLabels = (): InterviewRoomLabels => {
    const t = useTranslations("app.interview")
    return {
        title: t("roomTitle"),
        note: t("room.note"),
        progressTitle: t("room.progressTitle"),
        end: t("room.end"),
        endTitle: t("room.endTitle"),
        endDescription: t("room.endDescription"),
        endConfirm: t("room.endConfirm"),
        endCancel: t("room.endCancel"),
        endAbandon: t("room.endAbandon"),
        noAnswer: t("room.noAnswer"),
        answer: t("room.answerLabel"),
        placeholder: t("room.answerPlaceholder"),
        send: t("room.send"),
        sending: t("room.sending"),
        saved: t("room.saved"),
        hint: t("room.hint"),
        hintNone: t("room.hintNone"),
        hintNote: t("room.hintNote"),
        skip: t("room.skip"),
        retry: t("room.retry"),
        retrying: t("room.retrying"),
        done: t("room.done"),
        submit: t("room.submit"),
        grading: t("room.grading"),
        gradingNote: t("room.gradingNote"),
        closedTitle: t("room.closedTitle"),
        closedDescription: t("room.closedDescription"),
        openReport: t("room.openReport"),
        material: t("room.codeLabel"),
        diagram: t("room.diagramLabel"),
        diagramError: t("room.errors.other"),
        back: t("room.back"),
        abandonNow: t("room.abandonNow"),
    }
}
