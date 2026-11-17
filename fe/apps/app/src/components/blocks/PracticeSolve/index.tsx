"use client"

import { useLocale, useTranslations } from "next-intl"
import {
    difficultyToneOf,
    hintsOf,
    languageOf,
    languageOptions,
    markdownBlocksOf,
    problemRowsOf,
    resultStateOf,
    usePracticeListWords,
    usePracticeResultWords,
    usePracticeSolve,
    usePracticeSolveLabels,
} from "@/hooks/practice"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryPracticeProblemSwr, useQueryPracticeProblemsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, practicePatternPath } from "@/modules/routes"
import type { PracticeProblemView } from "@/modules/types"
import { PRACTICE_SOLVE_PLACEHOLDER, PracticeSolveBase, type PracticeSolveView } from "./component"

/** What the route hands the solve block: the problem in the address. */
type PracticeSolveProps = { readonly slug: string }

/** The limits of a problem in words ("2 s · 256 MB"). */
const limitsOf = (problem: PracticeProblemView): string =>
    `${problem.timeLimitMs / 1000} s · ${Math.round(problem.memoryLimitKb / 1024)} MB`

/** The connected solve screen of one problem: reads it with its pattern's list, keeps the learner's work and words every label. */
export const PracticeSolve = (props: PracticeSolveProps) => {
    const t = useTranslations("app.practice")
    const locale = useLocale()
    const read = useQueryPracticeProblemSwr(props.slug, locale)
    const problem = read.data
    const siblings = useQueryPracticeProblemsSwr(problem?.patternId, locale).data ?? []
    const words = usePracticeListWords()
    const result = usePracticeResultWords()
    const copy = usePracticeSolveLabels()
    const work = usePracticeSolve(props.slug, problem)
    useDocumentTitle(problem === undefined ? undefined : `${problem.title} · ${t("catalog.pageTitle")}`)
    const viewOf = (each: PracticeProblemView): PracticeSolveView => ({
        title: each.title,
        patternTitle: each.patternTitle,
        patternHref: practicePatternPath(each.patternId),
        eyebrow: each.patternTitle,
        difficulty: words.difficulty(each.difficulty),
        difficultyTone: difficultyToneOf(each.difficulty),
        facts: [...each.tags, limitsOf(each)],
        blocks: markdownBlocksOf(each.statementMarkdown),
        examples: each.examples,
        isLocked: each.locked,
        hintsTotal: each.hintsTotal,
        rail: problemRowsOf(siblings, words, each.slug),
    })
    return (
        <PracticeSolveBase
            props={{
                slot: mapSlot(slotOfSwr(read), viewOf),
                placeholder: PRACTICE_SOLVE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("solve.empty")),
                labels: {
                    breadcrumbs: t("solve.breadcrumbs"),
                    catalog: t("catalog.pageTitle"),
                    rail: t("solve.rail"),
                    railEmpty: t("solve.railEmpty"),
                    problem: copy.problem,
                    editor: copy.editor,
                    hints: copy.hints,
                    result: result.labels,
                    locked: {
                        title: t("solve.lockedTitle"),
                        description: t("solve.lockedText"),
                        plans: t("solve.plans"),
                    },
                    rateLimited: t("solve.rateLimited"),
                    failed: t("solve.failed"),
                    hintLocked: t("solve.hintLocked"),
                    hintFailed: t("solve.hintFailed"),
                },
                state: {
                    languages: languageOptions(),
                    language: work.draft.language,
                    code: work.draft.code,
                    issue: work.issue,
                    result: resultStateOf(work.submission, work.isStarting, problem?.nextSlug ?? null, result.words),
                    hints: hintsOf(work.hints.hints),
                    hintIssue: work.hints.issue,
                },
                isBusy: work.isBusy,
                isRevealing: work.hints.isRevealing,
                catalogHref: APP_ROUTES.practice,
                plansHref: APP_ROUTES.premium,
            }}
            on={{
                retry: () => void read.mutate(),
                language: (id) => {
                    const next = languageOf(id)
                    if (next !== undefined) work.draft.chooseLanguage(next)
                },
                write: work.draft.write,
                reset: work.draft.reset,
                run: work.run,
                submit: work.submit,
                reveal: work.hints.reveal,
            }}
        />
    )
}
