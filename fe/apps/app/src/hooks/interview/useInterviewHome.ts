"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { useLocale } from "next-intl"
import { useCallback, useState } from "react"
import {
    useMutateAbandonInterviewSwr,
    useMutateStartInterviewSwr,
    useQueryInterviewHistorySwr,
    useQueryInterviewOptionsSwr,
} from "@/hooks/swr"
import { interviewRoomPath } from "@/modules/routes"
import { ANY_LANGUAGE, interviewIssueOf, tierOf, type InterviewIssue, type InterviewTierId } from "./interview.shared"

/** What the home screen holds and does. */
export type InterviewHomeModel = {
    readonly options: ReturnType<typeof useQueryInterviewOptionsSwr>
    readonly history: ReturnType<typeof useQueryInterviewHistorySwr>
    readonly track: string
    readonly tier: InterviewTierId
    readonly language: string
    readonly issue: InterviewIssue
    readonly isStarting: boolean
    readonly isAbandoning: boolean
    readonly chooseTrack: (track: string) => void
    readonly chooseTier: (tier: string) => void
    readonly chooseLanguage: (language: string) => void
    readonly start: () => void
    readonly abandon: (sessionId: string) => void
}

/** A key the start carries, so a double press never starts two sessions. */
const requestId = (): string => globalThis.crypto.randomUUID()

/**
 * The work of the interview home: the options of the track, the history, the setup the learner picks and the start. A refused
 * start becomes an issue the screen words by its stable code; a started session opens its room.
 */
export const useInterviewHome = (): InterviewHomeModel => {
    const locale = useLocale()
    const router = navigation.useRouter()
    const [chosenTrack, setChosenTrack] = useState<string | null>(null)
    const [tier, setTier] = useState<InterviewTierId>("junior")
    const [language, setLanguage] = useState<string>(ANY_LANGUAGE)
    const [issue, setIssue] = useState<InterviewIssue>("none")
    const options = useQueryInterviewOptionsSwr(locale, chosenTrack)
    const history = useQueryInterviewHistorySwr()
    const { trigger: triggerStart, isMutating: isStarting } = useMutateStartInterviewSwr()
    const { trigger: triggerAbandon, isMutating: isAbandoning } = useMutateAbandonInterviewSwr()
    const track = chosenTrack ?? options.data?.tracks[0]?.id ?? ""
    const start = useCallback(() => {
        setIssue("none")
        triggerStart({
            track,
            bankIds: null,
            tier,
            locale: locale === "en" ? "en" : "vi",
            language: language === ANY_LANGUAGE ? null : language,
            clientRequestId: requestId(),
        }).then(
            (session) => router.push(interviewRoomPath(session.sessionId)),
            (error: unknown) => setIssue(interviewIssueOf(error)),
        )
    }, [triggerStart, router, track, tier, language, locale])
    const abandon = useCallback(
        (sessionId: string) => {
            triggerAbandon({ sessionId }).then(
                () => Promise.all([options.mutate(), history.mutate()]),
                (error: unknown) => setIssue(interviewIssueOf(error)),
            )
        },
        [triggerAbandon, options, history],
    )
    return {
        options,
        history,
        track,
        tier,
        language,
        issue,
        isStarting,
        isAbandoning,
        chooseTrack: (next) => {
            setChosenTrack(next)
            setLanguage(ANY_LANGUAGE)
            setIssue("none")
        },
        chooseTier: (next) => setTier(tierOf(next) ?? "junior"),
        chooseLanguage: setLanguage,
        start,
        abandon,
    }
}
