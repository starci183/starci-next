"use client"

import { useTranslations } from "next-intl"
import type { InterviewBubble } from "@starci-next/ui"
import {
    interviewQuestionStateOf,
    isSavedIssue,
    useInterviewRoom,
    type InterviewIssue,
    type InterviewTurnRead,
} from "@/hooks/interview"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import type { InterviewSessionRead } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, interviewReportPath } from "@/modules/routes"
import {
    INTERVIEW_ROOM_PLACEHOLDER,
    InterviewRoomBase,
    type InterviewProgressView,
    type InterviewRoomLabels,
    type InterviewRoomView,
} from "./component"

/** What the route hands the room block: the session in the address. */
type InterviewRoomProps = { readonly sessionId: string }

type Translate = ReturnType<typeof useTranslations>
type ProgressState = InterviewProgressView["state"]

/** The words of a refusal of a step of the room; empty for none. */
const issueWordsOf = (t: Translate, issue: InterviewIssue): string => {
    switch (issue) {
        case "none":
            return ""
        case "aiLimit":
            return t("room.errors.aiLimit")
        case "noAnswer":
            return t("room.errors.noAnswer")
        case "unconfigured":
            return t("room.errors.unconfigured")
        case "unavailable":
            return t("room.errors.unavailable")
        case "invalid":
            return t("room.errors.invalid")
        case "conflict":
            return t("room.errors.conflict")
        case "premiumRequired":
        case "sessionActive":
        case "poolEmpty":
        case "setupInvalid":
        case "other":
            return t("room.errors.other")
    }
}

/** The author line of a bubble. */
const authorOf = (t: Translate, turn: InterviewTurnRead): string => {
    if (turn.role === "candidate") return t("room.you")
    const interviewer = t("room.interviewer")
    return turn.kind === "prompt"
        ? [interviewer, t("room.questionN", { n: turn.position + 1 })].join(" · ")
        : interviewer
}

/** The neutral marker of a bubble: a follow-up or a hint; empty for none. */
const badgeOf = (t: Translate, turn: InterviewTurnRead): string => {
    if (turn.kind === "followUp" || turn.kind === "probe") return t("room.followUp")
    return turn.kind === "hint" ? t("room.hint") : ""
}

/** One bubble of the conversation. */
const bubbleOf = (t: Translate, turn: InterviewTurnRead): InterviewBubble => ({
    id: turn.turnId,
    isMine: turn.role === "candidate",
    author: authorOf(t, turn),
    text: turn.content,
    badge: badgeOf(t, turn),
})

/** The words under a question of the progress list. */
const stateWordsOf = (t: Translate, state: ProgressState): string => {
    switch (state) {
        case "complete":
            return t("room.progressAnswered")
        case "paused":
            return t("room.progressSkipped")
        case "current":
            return t("room.progressNow")
        case "upcoming":
            return t("room.progressLater")
    }
}

/** The progress list: one step per question. */
const progressOf = (t: Translate, session: InterviewSessionRead): ReadonlyArray<InterviewProgressView> =>
    session.questions.map((question) => {
        const state = interviewQuestionStateOf(session, question)
        return {
            id: `q${question.position}`,
            label: t("room.questionN", { n: question.position + 1 }),
            description: stateWordsOf(t, state),
            state,
        }
    })

/** The fixed words of the room. */
const labelsOf = (t: Translate): InterviewRoomLabels => ({
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
})

/** The connected interview room: reads the session, keeps the draft and the actions, and words every label. */
export const InterviewRoom = (props: InterviewRoomProps) => {
    const t = useTranslations("app.interview")
    const room = useInterviewRoom(props.sessionId)
    useDocumentTitle(t("roomTitle"))
    const slotLabels = useSlotLabels()(t("room.closedDescription"))
    const viewOf = (session: InterviewSessionRead): InterviewRoomView => ({
        counter: t("room.counter", { current: session.position + 1, total: session.setup.length }),
        tier: t("room.tierBadge", {
            tier: t(`home.tier${session.setup.tier.charAt(0).toUpperCase()}${session.setup.tier.slice(1)}`),
        }),
        bubbles: session.turns.map((turn) => bubbleOf(t, turn)),
        progress: progressOf(t, session),
        currentId: `q${session.position}`,
        material: room.material,
        isActive: room.isActive,
        isFinished: room.isFinished,
        needsReply: room.needsReply,
    })
    return (
        <InterviewRoomBase
            props={{
                slot: mapSlot(slotOfSwr(room.session), viewOf),
                placeholder: INTERVIEW_ROOM_PLACEHOLDER,
                slotLabels,
                labels: labelsOf(t),
                state: {
                    draft: room.draft,
                    hintLabel: t("room.hintLeft", { count: room.hintsLeft }),
                    hintsLeft: room.hintsLeft,
                    answeredCount: room.answeredCount,
                    issueWords: issueWordsOf(t, room.issue),
                },
                isSending: room.isSending,
                isRetrying: room.isRetrying,
                isHinting: room.isHinting,
                isGrading: room.isGrading,
                isEndOpen: room.isEndOpen,
                isIssueSaved: isSavedIssue(room.issue),
                isNoAnswer: room.issue === "noAnswer",
                reportHref: interviewReportPath(props.sessionId),
                homeHref: APP_ROUTES.interview,
            }}
            on={{
                retryRead: () => void room.session.mutate(),
                write: room.write,
                send: room.send,
                skip: room.skip,
                hint: room.hint,
                retry: room.retry,
                submit: room.submit,
                abandon: room.abandon,
                openEnd: room.openEnd,
            }}
        />
    )
}
