"use client"

import { useTranslations } from "next-intl"
import type { HubWords } from "./hub.shared"

/** Resolves the words the hub is built with from the `app.hub` catalog; every key is named, none is composed. */
export const useHubWords = (): HubWords => {
    const t = useTranslations("app.hub")
    return {
        streakUnit: (count) => t("streak.current", { count }),
        streakLine: (longest, freezes) =>
            t("streak.line", { longest, freezes: t("streak.freezes", { count: freezes }) }),
        weekTitle: t("streak.weekTitle"),
        weekValue: (done, goal) => t("streak.weekGoal", { done, goal }),
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
        todayLeft: (count) => t("today.titleLeft", { count }),
        todayDone: t("today.titleDone"),
    }
}
