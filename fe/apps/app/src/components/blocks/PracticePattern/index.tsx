"use client"

import { useLocale, useTranslations } from "next-intl"
import { useViewerPremium } from "@/hooks/catalog"
import { problemRowsOf, usePracticeListWords } from "@/hooks/practice"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPracticePatternsSwr, useQueryPracticeProblemsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { PRACTICE_PATTERN_PLACEHOLDER, PracticePatternBase } from "./component"

/** What the route hands the pattern block: the segment of the address. */
type PracticePatternProps = { readonly patternId: string }

/** The connected pattern screen: reads the problems of one pattern and the pattern list (which names it) and words every row. */
export const PracticePattern = (props: PracticePatternProps) => {
    const t = useTranslations("app.practice.pattern")
    const locale = useLocale()
    const read = useQueryPracticeProblemsSwr(props.patternId, locale)
    const pattern = useQueryPracticePatternsSwr(locale).data?.find((each) => each.patternId === props.patternId)
    const words = usePracticeListWords()
    const isPremium = useViewerPremium()
    const title = pattern?.title ?? t("pageTitle")
    useDocumentTitle(pattern === undefined ? undefined : `${pattern.title} · ${t("catalog")}`)
    return (
        <PracticePatternBase
            props={{
                labels: { title, breadcrumbs: t("breadcrumbs"), catalog: t("catalog") },
                catalogHref: APP_ROUTES.practice,
                browse: {
                    slot: mapSlot(slotOfSwr(read), (problems) => ({
                        lines: [
                            t("facts", {
                                accepted: problems.filter((problem) => problem.status === "ACCEPTED").length,
                                total: problems.length,
                                free: pattern?.freeCount ?? 0,
                            }),
                        ],
                        rows: problemRowsOf(problems, words, undefined),
                    })),
                    placeholder: PRACTICE_PATTERN_PLACEHOLDER,
                    slotLabels: useSlotLabels()(t("empty")),
                    cardLabel: title,
                    intro: "",
                    upsell: isPremium
                        ? undefined
                        : { label: t("upsell"), note: t("upsellNote"), href: APP_ROUTES.premium },
                    listLabel: t("list"),
                    emptyLabel: t("empty"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
