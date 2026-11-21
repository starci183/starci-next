"use client"

import { useFormatter, useTranslations } from "next-intl"
import { plainLineOf } from "./experience.shared"
import { useExperienceWords, type ExperienceWords } from "./useExperienceWords"

/** The words of the review queue and the review item: the experience words plus a day and month with the time of day. */
export interface ReviewWords extends ExperienceWords {
    /** A day and month with the time of day, e.g. 12/11, 09:20. */
    readonly moment: (iso: string) => string
}

/** What naming an item reads: its submitted and drafted lines and its subject. */
export type NamedItem = {
    readonly line: { readonly vi: string } | null
    readonly draftLine: { readonly vi: string } | null
    readonly subject: string
}

/** The name of an item under review: its line once drafted, else its subject. */
export const itemNameOf = (item: NamedItem): string => {
    const plain = plainLineOf((item.line ?? item.draftLine)?.vi ?? "")
    return plain === "" ? item.subject : plain
}

/** One day in milliseconds. */
const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days from now to the deadline: positive while time is left, negative once it has passed, 0 on the day itself. */
export const daysUntil = (iso: string, now: number): number => {
    const left = new Date(iso).getTime() - now
    return left >= 0 ? Math.floor(left / DAY_MS) : -Math.ceil(-left / DAY_MS)
}

/** The review screens' words, built on the shared experience words. */
export const useReviewWords = (): ReviewWords => {
    const words = useExperienceWords()
    const t = useTranslations("app.experience")
    const format = useFormatter()
    return {
        ...words,
        moment: (iso) =>
            t("moment", {
                date: format.dateTime(new Date(iso), { day: "numeric", month: "numeric" }),
                time: format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" }),
            }),
    }
}
