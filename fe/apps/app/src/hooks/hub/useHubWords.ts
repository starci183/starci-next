"use client"

import { useTranslations } from "next-intl"
import type { HubWords } from "./hub.shared"

/** Resolves the words the hub is built with from the `app.hub` catalog; every key is named, none is composed. */
export const useHubWords = (): HubWords => {
    const t = useTranslations("app.hub")
    return {
        counter: (count) => t("shards.counterOn", { count }),
        counterOff: t("shards.counterOff"),
        verified: (count) => t("shards.verified", { count }),
        pending: (count) => t("shards.pending", { count }),
        streakCurrent: (count) => t("streak.current", { count }),
        streakLongest: (count) => t("streak.longest", { count }),
        freezes: (count) => t("streak.freezes", { count }),
        weekGoal: (done, goal) => t("streak.weekGoal", { done, goal }),
        dayCounted: t("streak.counted"),
        dayMissed: t("streak.missed"),
        dayFreeze: t("streak.freezeDay"),
        dayToday: t("streak.todayOpen"),
        weekday: {
            sun: t("streak.weekdays.sun"),
            mon: t("streak.weekdays.mon"),
            tue: t("streak.weekdays.tue"),
            wed: t("streak.weekdays.wed"),
            thu: t("streak.weekdays.thu"),
            fri: t("streak.weekdays.fri"),
            sat: t("streak.weekdays.sat"),
        },
        stage: {
            essentials: t("shards.stage.essentials"),
            review: t("shards.stage.review"),
            practice: t("shards.stage.practice"),
            projects: t("shards.stage.projects"),
            incidents: t("shards.stage.incidents"),
            interview: t("shards.stage.interview"),
        },
        next: {
            essentials: t("shards.next.essentials"),
            review: t("shards.next.review"),
            practice: t("shards.next.practice"),
            projects: t("shards.next.projects"),
            incidents: t("shards.next.incidents"),
            interview: t("shards.next.interview"),
        },
        layerBody: {
            mission: t("layers.mission"),
            profile: t("layers.profile"),
            hiring: t("layers.hiring"),
        },
        todayLeft: (count) => t("today.titleLeft", { count }),
        todayDone: t("today.titleDone"),
    }
}
