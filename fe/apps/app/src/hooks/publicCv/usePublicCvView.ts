"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { failureCodeOf, plainLineOf, useExperienceWords } from "@/hooks/experience"
import { useLocalizedPathname } from "@/hooks/locale"
import { useOrigin } from "@/hooks/profile"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPublicCvSwr, type PublicCv } from "@/hooks/swr"
import { navigation } from "@starci-next/i18n/navigation"
import { PUBLIC_CV_NOT_FOUND_CODES } from "@/modules/api"
import { APP_ROUTES, verifyPath } from "@/modules/routes"
import type { PublicCvLabels, PublicCvLineView, PublicCvScreenView, PublicCvShareLabels } from "@/modules/types"
import {
    ALL_SOURCES,
    PUBLIC_CV_EVIDENCE,
    PUBLIC_CV_LIMIT,
    PUBLIC_CV_SHORT_LIST,
    linesOfSource,
    newestSignedAt,
    sourcesOf,
    type PublicCvLine,
} from "./publicCv.shared"
import { useCanShare, useIsPhone, usePreviewSrc } from "./useViewport"

/** The steps of the trust trail, in the order every line carries them. */
const STEP_IDS = ["proved", "graded", "signed"] as const

/** What the page is built from: the slug of the address and what the server already read. */
type PublicCvViewInput = { readonly slug: string; readonly initial?: PublicCv | undefined }

/** Resolves the fixed words of the page. */
export const usePublicCvLabels = (): PublicCvLabels => {
    const t = useTranslations("app.publicCv")
    const locale = useLocale()
    const shell = useTranslations("app.shell")
    return {
        brand: shell("brand"),
        logoSrc: "/brand/logo.png",
        homeHref: navigation.getPathname({ href: APP_ROUTES.home, locale }),
        signIn: t("signIn"),
        signInHref: navigation.getPathname({ href: APP_ROUTES.signIn, locale }),
        verifiedBy: t("verifiedBy"),
        share: t("share"),
        linesTitle: t("linesTitle"),
        note: t("note"),
        empty: t("empty"),
        allSources: t("allSources"),
        sourcesLabel: t("sourcesLabel"),
        verify: t("verify"),
        aiText: t("aiGraded"),
        whyTitle: t("whyTitle"),
        steps: STEP_IDS.map((id) => ({ id, label: t(`steps.${id}.label`), description: t(`steps.${id}.description`) })),
        stepsLabel: t("stepsLabel"),
        whyNote: t("whyNote"),
        footNote: t("footNote"),
        footCta: t("footCta"),
        notFoundTitle: t("notFoundTitle"),
        notFoundDescription: t("notFoundDescription"),
        notFoundHome: t("notFoundHome"),
        notFoundAddressLabel: t("notFoundAddressLabel"),
        copy: t("copy"),
        copied: t("copied"),
        copyError: t("copyError"),
    }
}

/** The words of one line's trust trail: the proof, and who signed when. */
const useLineWords = () => {
    const t = useTranslations("app.publicCv")
    const words = useExperienceWords()
    return (line: PublicCvLine): PublicCvLineView => {
        const kinds = line.evidence.map((entry) =>
            t(`evidence.${PUBLIC_CV_EVIDENCE.has(entry.kind) ? entry.kind : "other"}`, { count: entry.count ?? 0 }),
        )
        return {
            id: line.verificationCode,
            title: plainLineOf(line.line),
            sourceId: line.source,
            sourceLabel: words.part(line.source),
            subject: line.subject,
            proofText: t("proof", { kinds: kinds.join(", ") }),
            signText: t(line.signerRole === "REVIEWER" ? "signedReviewer" : "signedTeacher", {
                date: words.date(line.signedAt),
            }),
            code: line.verificationCode,
            verifyHref: verifyPath(line.verificationCode),
        }
    }
}

/** The public CV: reads one slug without a session, filters its lines by source, folds them under "Xem thêm", and holds the share sheet. */
export const usePublicCvView = (input: PublicCvViewInput) => {
    const t = useTranslations("app.publicCv")
    const locale = useLocale()
    const words = useExperienceWords()
    const lineView = useLineWords()
    const read = useQueryPublicCvSwr(decodeURIComponent(input.slug), locale, input.initial)
    const isPhone = useIsPhone()
    const canShare = useCanShare()
    const previewSrc = usePreviewSrc()
    const [source, setSource] = useState(ALL_SOURCES)
    const [shown, setShown] = useState(0)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const origin = useOrigin()
    const pathname = useLocalizedPathname()
    const labels = usePublicCvLabels()
    const slotLabels = useSlotLabels()(labels.notFoundTitle)
    const limit = (isPhone ? PUBLIC_CV_LIMIT.phone : PUBLIC_CV_LIMIT.wide) + shown
    const isNotFound = read.error !== undefined && PUBLIC_CV_NOT_FOUND_CODES.has(failureCodeOf(read.error))
    const url = `${origin}${pathname}`
    const name = read.data?.displayName ?? ""
    const shareLabels: PublicCvShareLabels = {
        title: t("shareTitle", { name }),
        closeLabel: t("shareClose"),
        linkLabel: t("shareLink"),
        previewTitle: t("sharePreview"),
        previewAlt: t("sharePreviewAlt", { name }),
        other: t("shareOther"),
        targets: [
            {
                id: "linkedin",
                label: "LinkedIn",
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            },
            {
                id: "facebook",
                label: "Facebook",
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            },
            { id: "zalo", label: "Zalo", href: `https://zalo.me/share?url=${encodeURIComponent(url)}` },
        ],
    }
    const slot = mapSlot(slotOfSwr(read), (cv): PublicCvScreenView => {
        const matching = linesOfSource(cv.lines, source)
        const newest = newestSignedAt(cv.lines)
        return {
            name: cv.displayName,
            avatarUrl: cv.avatarUrl ?? null,
            facts: [
                t("factsCount", { count: cv.lines.length }),
                ...(newest === undefined ? [] : [t("factsUpdated", { date: words.date(newest) })]),
            ].join(" · "),
            total: cv.lines.length,
            sources: sourcesOf(cv.lines, words.part),
            lines: matching.slice(0, limit).map(lineView),
            hidden: Math.max(0, matching.length - limit),
            moreLabel: t("more", { count: Math.max(0, matching.length - limit) }),
            growNote:
                cv.lines.length > 0 && cv.lines.length <= PUBLIC_CV_SHORT_LIST
                    ? t("fewNote", { name: cv.displayName })
                    : "",
        }
    })
    return {
        shape: isNotFound ? ("notFound" as const) : ("read" as const),
        slot,
        slotLabels,
        labels,
        shareLabels,
        source,
        isShareOpen,
        isPhone,
        canShare,
        url,
        previewSrc,
        name,
        retry: () => void read.mutate(),
        chooseSource: (next: string) => {
            setSource(next)
            setShown(0)
        },
        showMore: () => setShown((count) => count + PUBLIC_CV_LIMIT.wide),
        setShareOpen: setIsShareOpen,
        shareNative: () => void navigator.share({ title: shareLabels.title, url }).catch(() => undefined),
    }
}
