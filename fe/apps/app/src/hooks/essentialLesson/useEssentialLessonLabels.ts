"use client"

import { useFormatter, useTranslations } from "next-intl"
import type { EssentialPartsLabels } from "@starci-next/ui"
import { useLessonCardLabels, useLessonJourneyLabels } from "@/hooks/lessonStudy"
import type { EssentialPart } from "@/modules/types"
import type { EssentialWords } from "./essentialLesson.shared"

/** The words of the lesson page around the four parts. */
export type EssentialPageLabels = {
    readonly pageTitle: string
    readonly breadcrumbs: string
    readonly tabs: string
    readonly parts: Readonly<Record<EssentialPart, string>>
    readonly facts: (minutes: number) => string
    readonly empty: string
    readonly soon: string
}

/** Every word of the four-part lesson page, resolved once: the page, the parts and the builders' phrases. */
export const useEssentialLessonLabels = (): {
    readonly page: EssentialPageLabels
    readonly parts: EssentialPartsLabels
    readonly words: EssentialWords
} => {
    const t = useTranslations("app.essentials.essential")
    const format = useFormatter()
    const cards = useLessonCardLabels()
    const journey = useLessonJourneyLabels()
    const scenarioStates = {
        none: t("scenarios.states.none"),
        running: t("scenarios.states.running"),
        passed: t("scenarios.states.passed"),
        failed: t("scenarios.states.failed"),
        guarded: t("scenarios.states.guarded"),
    }
    return {
        page: {
            pageTitle: t("pageTitle"),
            breadcrumbs: t("breadcrumbs"),
            tabs: t("tabs"),
            parts: {
                essence: t("parts.essence"),
                source: t("parts.source"),
                scenarios: t("parts.scenarios"),
                apply: t("parts.apply"),
            },
            facts: (minutes) => t("facts", { minutes, languages: t("typescript") }),
            empty: t("empty"),
            soon: t("soon"),
        },
        parts: {
            choice: cards.choice,
            markdown: journey.markdown,
            opener: {
                title: t("opener.title"),
                progress: t("opener.progress"),
                next: t("opener.next"),
                previous: t("opener.previous"),
                right: t("opener.right"),
                wrong: t("opener.wrong"),
                readMore: t("opener.readMore"),
                empty: t("opener.empty"),
            },
            article: {
                title: t("article.title"),
                toc: t("article.toc"),
                flagged: t("article.flagged"),
                locked: t("article.locked"),
                empty: t("article.empty"),
            },
            retake: {
                title: t("retake.title"),
                description: t("retake.description"),
                start: t("retake.start"),
                question: t("retake.question"),
                before: t("retake.before"),
                after: t("retake.after"),
                right: t("retake.right"),
                wrong: t("retake.wrong"),
                none: t("retake.none"),
            },
            source: {
                pullTitle: t("source.pullTitle"),
                pullNote: t("source.pullNote"),
                architecture: t("source.architecture"),
                diagram: t("source.diagram"),
                diagramError: t("source.diagramError"),
                components: t("source.components"),
                component: t("source.component"),
                port: t("source.port"),
                rules: t("source.rules"),
                codeWalk: t("source.codeWalk"),
                why: t("source.why"),
                empty: t("source.empty"),
            },
            scenarios: {
                list: t("scenarios.list"),
                run: t("scenarios.run"),
                guards: t("scenarios.guards"),
                expected: t("scenarios.expected"),
                output: t("scenarios.output"),
                noOutput: t("scenarios.noOutput"),
                why: t("scenarios.why"),
                invariant: t("scenarios.invariant"),
                hint: t("scenarios.hint"),
                askAi: t("scenarios.askAi"),
                askAiNote: t("scenarios.askAiNote"),
                prompt: t("scenarios.prompt"),
                check: t("scenarios.check"),
                empty: t("scenarios.empty"),
            },
            apply: {
                ladder: t("apply.ladder"),
                brief: t("apply.brief"),
                rubric: t("apply.rubric"),
                critical: t("apply.critical"),
                essence: t("apply.essence"),
                hidden: t("apply.hidden"),
                run: t("apply.run"),
                proof: t("apply.proof"),
                proofSteps: t("apply.proofSteps"),
                locked: t("apply.locked"),
                empty: t("apply.empty"),
            },
            locked: { title: t("locked.title"), description: t("locked.description"), plans: t("locked.plans") },
        },
        words: {
            position: (n, total) => t("opener.position", { n, total }),
            score: (right, total) => t("opener.score", { right, total }),
            readSection: (n, title) => t("opener.readSection", { n, title }),
            seeScenario: (title) => t("opener.seeScenario", { title }),
            scenarioStates,
            scenariosSummary: (green, total) => t("scenarios.summary", { green, total }),
            ranAt: (at) =>
                t("scenarios.ranAt", { at: format.dateTime(new Date(at), { timeStyle: "short", dateStyle: "short" }) }),
            fixPrompt: (input) =>
                t("scenarios.fixPrompt", { ...input, why: input.why === "" ? "" : input.why })
                    .split("\n")
                    .filter((line) => line.trim() !== "")
                    .join("\n"),
            levels: {
                easy: t("apply.levels.easy"),
                medium: t("apply.levels.medium"),
                hard: t("apply.levels.hard"),
                insane: t("apply.levels.insane"),
            },
            points: (points) => t("apply.points", { points }),
            hiddenState: (green, total) => t("apply.hiddenState", { green, total }),
            notRun: t("apply.notRun"),
            rungStates: {
                locked: t("apply.rungStates.locked"),
                open: t("apply.rungStates.open"),
                green: t("apply.rungStates.green"),
            },
        },
    }
}
