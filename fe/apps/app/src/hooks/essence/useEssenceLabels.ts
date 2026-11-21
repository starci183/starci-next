"use client"

import { useFormatter, useTranslations } from "next-intl"
import type { EssenceLabels } from "@starci-next/ui"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"
import type { EssentialPart } from "@/modules/types"
import type { EssenceWords } from "./essence.shared"

/** The words of the lesson page header, tabs, notices and the locked part. */
export type EssenceShellLabels = {
    readonly nextQuestion: string
    readonly seeResult: string
    readonly readArticle: string
    readonly retake: string
    readonly upgrade: string
    readonly tabDone: string
    readonly tabLocked: string
    readonly position: (n: number, total: number, topic: string) => string
    readonly facts: (minutes: number, scenarios: number, levels: number) => string
    readonly factsPlain: (minutes: number) => string
    readonly locked: Readonly<
        Record<Exclude<EssentialPart, "essence">, { readonly title: string; readonly contents: ReadonlyArray<string> }>
    >
    readonly lockedDescription: string
    readonly lockedList: string
    readonly lockedBack: string
    readonly lockedCompare: string
}

/** The translator of the part's own message tree. */
type Translate = ReturnType<typeof useTranslations>

/** The static words of the opener, the result, the contents, the article and the aside. */
const labelsOf = (t: Translate, markdown: EssenceLabels["markdown"]): EssenceLabels => ({
    markdown,
    opener: {
        eyebrow: t("opener.eyebrow"),
        barLabel: t("opener.barLabel"),
        hint: t("opener.hint"),
        empty: t("opener.empty"),
        correct: t("opener.correct"),
        picked: t("opener.picked"),
        why: t("opener.why"),
        sendFailed: t("opener.sendFailed"),
        retry: t("opener.retry"),
        grading: t("opener.grading"),
        readMore: t("opener.readMore"),
        timeline: t("opener.timeline"),
        wrongMark: t("opener.wrongMark"),
        wrongTitle: t("opener.wrongTitle"),
        again: t("opener.again"),
        rightMark: t("opener.rightMark"),
        rightTitle: t("opener.rightTitle"),
        essence: t("opener.essence"),
        need: t("opener.need"),
        interview: t("opener.interview"),
        next: t("opener.next"),
        finish: t("opener.finish"),
    },
    result: {
        eyebrow: t("result.eyebrow"),
        passed: t("result.passed"),
        readArticle: t("result.readArticle"),
        review: t("result.review"),
        freeTitle: t("result.freeTitle"),
        freeText: t("result.freeText"),
        upgrade: t("shell.upgrade"),
    },
    toc: { title: t("toc.title"), flagged: t("toc.flagged") },
    article: { locked: t("article.locked"), empty: t("article.empty") },
    aside: {
        journeyTitle: t("aside.journeyTitle"),
        journeyNote: t("aside.journeyNote"),
        retakeTitle: t("aside.retakeTitle"),
        retakeText: t("aside.retakeText"),
        lockedPart: t("aside.lockedPart"),
    },
})

/** The words of the lesson shell: the header primary, the tab marks, the facts line and the locked part. */
const shellOf = (t: Translate): EssenceShellLabels => ({
    nextQuestion: t("shell.nextQuestion"),
    seeResult: t("shell.seeResult"),
    readArticle: t("shell.readArticle"),
    retake: t("shell.retake"),
    upgrade: t("shell.upgrade"),
    tabDone: t("shell.tabDone"),
    tabLocked: t("shell.tabLocked"),
    position: (n, total, topic) => t("shell.position", { n, total, topic }),
    facts: (minutes, scenarios, levels) => t("shell.facts", { minutes, scenarios, levels }),
    factsPlain: (minutes) => t("shell.factsPlain", { minutes }),
    locked: {
        source: {
            title: t("locked.source.title"),
            contents: [t("locked.source.one"), t("locked.source.two"), t("locked.source.three")],
        },
        scenarios: {
            title: t("locked.scenarios.title"),
            contents: [t("locked.scenarios.one"), t("locked.scenarios.two"), t("locked.scenarios.three")],
        },
        apply: {
            title: t("locked.apply.title"),
            contents: [t("locked.apply.one"), t("locked.apply.two"), t("locked.apply.three")],
        },
    },
    lockedDescription: t("locked.description"),
    lockedList: t("locked.list"),
    lockedBack: t("locked.back"),
    lockedCompare: t("locked.compare"),
})

/** Every word of the essence part (essence) and of the lesson shell around it, resolved once. */
export const useEssenceLabels = (): {
    readonly labels: EssenceLabels
    readonly words: EssenceWords
    readonly shell: EssenceShellLabels
} => {
    const t = useTranslations("app.essentials.essential.essence")
    const journey = useLessonJourneyLabels()
    const format = useFormatter()
    return {
        labels: labelsOf(t, journey.markdown),
        words: {
            questionName: (n) => t("bar.question", { n }),
            position: (n, total, right) => t("position", { n, total, right }),
            positionFirst: (n, total) => t("positionFirst", { n, total }),
            score: (right, total) => t("result.score", { right, total }),
            resultFlagged: (sections) => t("result.flagged", { sections }),
            resultClean: t("result.clean"),
            retakeLine: (right, total, before) => t("result.retake", { right, total, before }),
            readSection: (n, title) => t("opener.readSection", { n, title }),
            seeScenario: (title) => t("opener.seeScenario", { title }),
            articleEyebrow: (minutes) => t("article.eyebrow", { minutes }),
            passedText: (first, total) => t("result.passedText", { first, total }),
            sectionsList: (numbers) =>
                format.list(
                    numbers.map((n) => t("result.section", { n })),
                    { type: "conjunction" },
                ),
        },
        shell: shellOf(t),
    }
}
