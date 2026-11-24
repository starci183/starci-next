"use client"

import { useFormatter, useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { failureCodeOf, plainLineOf, useExperienceWords } from "@/hooks/experience"
import { useLocalizedPathname } from "@/hooks/locale"
import { useOrigin } from "@/hooks/profile"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPublicCvSwr } from "@/hooks/swr"
import { navigation } from "@starci-next/i18n/navigation"
import { PUBLIC_CV_NOT_FOUND_CODES } from "@/modules/api"
import { APP_ROUTES, verifyPath } from "@/modules/routes"
import type {
    PublicCvFigureView,
    PublicCvLabels,
    PublicCvLineView,
    PublicCvScreenView,
    PublicCvShareLabels,
} from "@/modules/types"
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

/** The public CV shows its source chips from this many signed lines: a shorter list is read whole at a glance. */
const PUBLIC_CV_CHIPS_FROM = 8

/** The steps of the trust trail, in the order every line carries them. */
const STEP_IDS = ["proved", "graded", "signed"] as const

/** The key figures of a CV: the signed lines, then the lines of Essentials, of Projects and of Harness with practice. */
const figuresOf = (
    lines: ReadonlyArray<PublicCvLine>,
    t: (key: "figSigned" | "figEssentials" | "figProjects" | "figPractice") => string,
): ReadonlyArray<PublicCvFigureView> => {
    const count = (...sources: ReadonlyArray<string>) => lines.filter((line) => sources.includes(line.source)).length
    return [
        { id: "signed", term: t("figSigned"), value: lines.length },
        { id: "essentials", term: t("figEssentials"), value: count("essentials") },
        { id: "projects", term: t("figProjects"), value: count("projects") },
        { id: "practice", term: t("figPractice"), value: count("harness", "practice", "incidents") },
    ]
}

/** What the page is built from: the slug of the address. */
type PublicCvViewInput = { readonly slug: string }

/**
 * The signing date of a line, in digits (21/11/2026): one word that never breaks, so a wrapped trust line never leaves the year alone.
 */
const useSignDate = () => {
    const format = useFormatter()
    return (iso: string): string =>
        format.dateTime(new Date(iso), { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * The fixed words of this page: the shared labels, with the list caption and the signing step worded for both signers (the teacher,
 * or a reviewer the teacher appointed), since a line may carry either.
 */
const usePageLabels = (): PublicCvLabels => {
    const t = useTranslations("app.publicCv")
    const labels = usePublicCvLabels()
    return {
        ...labels,
        note: t("linesNote"),
        steps: labels.steps.map((step) =>
            step.id === "signed" ? { ...step, description: t("signedStepText") } : step,
        ),
    }
}

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
        figuresLabel: t("figuresLabel"),
        verify: t("verify"),
        aiText: t("aiGraded"),
        whyTitle: t("whyTitle"),
        steps: STEP_IDS.map((id) => ({ id, label: t(`steps.${id}.label`), description: t(`steps.${id}.description`) })),
        whyNote: t("whyNote"),
        footNote: t("footNote"),
        footCta: t("footCta"),
        notFoundTitle: t("notFoundTitle"),
        notFoundDescription: t("notFoundDescription"),
        notFoundHome: t("notFoundHome"),
        copy: t("copy"),
        copied: t("copied"),
        copyError: t("copyError"),
    }
}

/**
 * The name a public CV shows: never an email, whatever the read carries (the API already words a neutral name; this keeps the page
 * safe if a name with an at sign ever reaches it).
 */
const publicName = (name: string, neutral: string): string => (name.includes("@") ? neutral : name)

/** The words of one line's trust trail: the proof, and who signed when. */
const useLineWords = () => {
    const t = useTranslations("app.publicCv")
    const words = useExperienceWords()
    const signDate = useSignDate()
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
                date: signDate(line.signedAt),
            }),
            code: line.verificationCode,
            verifyHref: verifyPath(line.verificationCode),
        }
    }
}

/**
 * The public CV: reads one slug in the browser without a session (the skeleton shows while the read is in flight, the failure notice
 * with its retry when it fails), filters its lines by source, folds them under "Xem thêm", and holds the share sheet. */
export const usePublicCvView = (input: PublicCvViewInput) => {
    const t = useTranslations("app.publicCv")
    const locale = useLocale()
    const words = useExperienceWords()
    const signDate = useSignDate()
    const lineView = useLineWords()
    const read = useQueryPublicCvSwr(decodeURIComponent(input.slug), locale)
    const isPhone = useIsPhone()
    const canShare = useCanShare()
    const previewSrc = usePreviewSrc()
    const [source, setSource] = useState(ALL_SOURCES)
    const [shown, setShown] = useState(0)
    const [isShareOpen, setIsShareOpen] = useState(false)
    const origin = useOrigin()
    const pathname = useLocalizedPathname()
    const labels = usePageLabels()
    const slotLabels = useSlotLabels()(labels.notFoundTitle, {
        title: t("cvLoadFailedTitle"),
        text: t("cvLoadFailedText"),
    })
    const limit = (isPhone ? PUBLIC_CV_LIMIT.phone : PUBLIC_CV_LIMIT.wide) + shown
    const isNotFound = read.error !== undefined && PUBLIC_CV_NOT_FOUND_CODES.has(failureCodeOf(read.error))
    const url = `${origin}${pathname}`
    const name = publicName(read.data?.displayName ?? "", t("neutralName"))
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
            name,
            avatarUrl: cv.avatarUrl ?? null,
            facts: [
                t("factsCount", { count: cv.lines.length }),
                ...(newest === undefined ? [] : [t("factsUpdated", { date: signDate(newest) })]),
            ].join(" · "),
            total: cv.lines.length,
            figures: figuresOf(cv.lines, t),
            sources: cv.lines.length < PUBLIC_CV_CHIPS_FROM ? [] : sourcesOf(cv.lines, words.part),
            lines: matching.slice(0, limit).map(lineView),
            hidden: Math.max(0, matching.length - limit),
            moreLabel: t("more", { count: Math.max(0, matching.length - limit) }),
            growNote: cv.lines.length > 0 && cv.lines.length <= PUBLIC_CV_SHORT_LIST ? t("fewNote", { name }) : "",
        }
    })
    return {
        shape: isNotFound
            ? ("notFound" as const)
            : "isLoading" in slot
              ? ("loading" as const)
              : "isError" in slot
                ? ("failed" as const)
                : ("read" as const),
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
        retry: (): undefined => void read.mutate(),
        chooseSource: (next: string) => {
            setSource(next)
            setShown(0)
        },
        showMore: (): void => setShown((count) => count + PUBLIC_CV_LIMIT.wide),
        setShareOpen: setIsShareOpen,
        shareNative: (): undefined => void navigator.share({ title: shareLabels.title, url }).catch(() => undefined),
    }
}
