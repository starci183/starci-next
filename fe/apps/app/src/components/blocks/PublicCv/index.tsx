"use client"

import { useLocale, useTranslations } from "next-intl"
import { failureCodeOf, plainLineOf, useExperienceWords } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPublicCvSwr } from "@/hooks/swr"
import { verifyPath } from "@/modules/routes"
import { PUBLIC_CV_PLACEHOLDER, PublicCvBase } from "./component"

/** What the route hands the block: the slug of the address. */
type PublicCvProps = { readonly slug: string }

/** The codes a door answers for a link nobody owns, or whose owner keeps it private: both read as not found. */
const NOT_FOUND_CODES: ReadonlySet<string> = new Set(["PROFILE_CV_NOT_FOUND", "HTTP_SECURITY_REQUEST_INVALID"])

/** The public CV: reads one slug without a session and words the signed lines with their source and date. */
export const PublicCv = (props: PublicCvProps) => {
    const t = useTranslations("app.publicCv")
    const locale = useLocale()
    const words = useExperienceWords()
    const read = useQueryPublicCvSwr(decodeURIComponent(props.slug), locale)
    const isNotFound = read.error !== undefined && NOT_FOUND_CODES.has(failureCodeOf(read.error))
    return (
        <PublicCvBase
            shape={isNotFound ? "notFound" : "read"}
            props={{
                slot: mapSlot(slotOfSwr(read), (cv) => ({
                    name: cv.displayName,
                    avatarUrl: cv.avatarUrl ?? null,
                    rows: cv.lines.map((line) => ({
                        id: line.verificationCode,
                        title: plainLineOf(line.line),
                        description: t("signed", { date: words.date(line.signedAt) }),
                        badges: [{ label: words.part(line.source), tone: "neutral" as const }],
                        action: { label: t("verify"), href: verifyPath(line.verificationCode), endArrow: true },
                    })),
                })),
                placeholder: PUBLIC_CV_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("notFoundTitle")),
                labels: {
                    title: t("title"),
                    linesTitle: t("linesTitle"),
                    note: t("note"),
                    empty: t("empty"),
                    notFoundTitle: t("notFoundTitle"),
                    notFoundDescription: t("notFoundDescription"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
