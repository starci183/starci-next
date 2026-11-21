import type { useTranslations } from "next-intl"

/** The words of a length of time: minutes under an hour, whole hours, or hours and minutes. */
export const hoursText = (t: ReturnType<typeof useTranslations>, hours: number, minutes: number): string => {
    if (hours === 0) return t("minutesOnly", { minutes })
    if (minutes === 0) return t("hoursOnly", { hours })
    return t("hours", { hours, minutes })
}
