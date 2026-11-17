"use client"

import type { PracticeExample, PracticeHintItem, PracticeResultState } from "@starci-next/ui"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { hintsOf, isUnsettled, resultStateOf, type PracticeResultWords } from "@/modules/practice-result"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useMutatePracticeSolutionSwr, useQueryPracticeProblemSwr, useQueryPracticeProblemsSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, practicePatternPath, practiceProblemPath } from "@/modules/routes"
import type { DataSlot, PracticeProblemView, PracticeSubmissionView, SlotLabels } from "@/modules/types"
import { languageOf, languageOptions, type PracticeIssue } from "./practice.shared"
import { usePracticeSolve } from "./usePracticeSolve"

/** The three tabs of the page. */
export type PracticeSolveTab = "problem" | "submissions" | "solution"

/** The problem as the page draws it: its heading facts and its statement. */
export type PracticeSolveView = {
    readonly title: string
    readonly patternTitle: string
    readonly patternHref: string
    readonly meta: string
    readonly markdown: string
    readonly examples: ReadonlyArray<PracticeExample>
    readonly hintsTotal: number
    readonly nextHref: string | null
    readonly isAccepted: boolean
}

/** One past submission of this visit, in words. */
export type PracticeSubmissionRow = {
    readonly id: string
    readonly title: string
    readonly meta: string
    readonly isAccepted: boolean
}

/** The words of the page that no data names. */
export type PracticeSolveLabels = {
    readonly breadcrumbs: string
    readonly catalog: string
    readonly tabsLabel: string
    readonly tabs: Readonly<Record<PracticeSolveTab, string>>
    readonly run: string
    readonly submit: string
    readonly judging: string
    readonly next: string
    readonly problemTitle: string
    readonly editorTitle: string
    readonly language: string
    readonly code: string
    readonly judgeNote: string
    readonly reset: string
    readonly examples: string
    readonly input: string
    readonly output: string
    readonly diagram: string
    readonly diagramError: string
    readonly hintsTitle: string
    readonly hintsNote: string
    readonly hintsReveal: string
    readonly hintsOpen: string
    readonly hintStep: (step: number) => string
    readonly resultTitle: string
    readonly compileOutput: string
    readonly expected: string
    readonly actual: string
    readonly tests: string
    readonly testsEmpty: string
    readonly solutionResultTitle: string
    readonly solutionResultText: string
    readonly solutionResultAction: string
    readonly submissionsTitle: string
    readonly submissionsEmpty: string
    readonly solutionTitle: string
    readonly solutionText: string
    readonly solutionAction: string
    readonly solutionSeenNote: string
    readonly solutionFailed: string
    readonly confirmTitle: string
    readonly confirmCancel: string
    readonly confirmAction: string
    readonly rateLimited: string
    readonly failed: string
    readonly hintFailed: string
    readonly loadFailedCrumb: string
    readonly loadFailedNote: string
}

/** The learner work and the answers on the page, ready to draw. */
export type PracticeSolveState = {
    readonly languages: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly language: string
    readonly code: string
    readonly issue: PracticeIssue
    readonly result: PracticeResultState
    readonly hints: ReadonlyArray<PracticeHintItem>
    readonly hintIssue: PracticeIssue
    readonly isBusy: boolean
    readonly isRevealingHint: boolean
    readonly tab: PracticeSolveTab
    readonly submissions: ReadonlyArray<PracticeSubmissionRow>
    readonly solution: string | null
    readonly isSolutionPending: boolean
    readonly isSolutionFailed: boolean
    readonly isConfirmOpen: boolean
    readonly confirmText: string
}

/** The solve screen: the resolved problem with its status, the learner work and the commands. */
export type PracticeSolveScreen = {
    readonly props: {
        readonly slot: DataSlot<PracticeSolveView>
        readonly placeholder: PracticeSolveView
        readonly slotLabels: SlotLabels
        readonly labels: PracticeSolveLabels
        readonly state: PracticeSolveState
        readonly catalogHref: string
    }
    readonly on: {
        readonly retry: () => void
        readonly selectTab: (tab: string) => void
        readonly language: (language: string) => void
        readonly write: (code: string) => void
        readonly reset: () => void
        readonly run: () => void
        readonly submit: () => void
        readonly reveal: () => void
        readonly openSolution: () => void
        readonly confirmSolution: () => void
        readonly cancelSolution: () => void
    }
}

/** The fake problem the skeleton draws while the first read runs. */
export const PRACTICE_SOLVE_PLACEHOLDER: PracticeSolveView = {
    title: "xxxxxxxxxxxxxx",
    patternTitle: "xxxxxx",
    patternHref: "/",
    meta: "xxxxxxxx · xxxxxxxx · xxxxxxxx",
    markdown: "",
    examples: [],
    hintsTotal: 3,
    nextHref: null,
    isAccepted: false,
}

/** The limits of a problem in words ("2 giây · 256 MB" comes from the caller; this is the number part). */
const memoryMbOf = (problem: PracticeProblemView): number => Math.round(problem.memoryLimitKb / 1024)

/** The tab a value names; anything else is the statement. */
const tabOf = (value: string): PracticeSolveTab => (value === "submissions" || value === "solution" ? value : "problem")

/** The connected solve screen of one problem: reads it with its pattern, keeps the work of the learner and words every label. */
export const usePracticeSolveScreen = (slug: string): PracticeSolveScreen => {
    const locale = useLocale()
    const t = useTranslations("app.practice.solve")
    const result = useTranslations("app.practice.result")
    const verdict = useTranslations("app.practice.verdict")
    const difficulty = useTranslations("app.practice.difficulty")
    const slotLabels = useSlotLabels()(t("emptyTitle"))
    const read = useQueryPracticeProblemSwr(slug, locale)
    const problem = read.data
    const siblings = useQueryPracticeProblemsSwr(problem?.patternId, locale).data ?? []
    const work = usePracticeSolve(slug, problem)
    const { trigger: triggerSolution, isMutating: isSolutionPending } = useMutatePracticeSolutionSwr()
    const [tab, setTab] = useState<PracticeSolveTab>("problem")
    const [history, setHistory] = useState<ReadonlyArray<PracticeSubmissionView>>([])
    const [solution, setSolution] = useState<string | null>(null)
    const [isSolutionFailed, setSolutionFailed] = useState(false)
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    useDocumentTitle(problem === undefined ? undefined : `${problem.title} · ${t("catalog")}`)
    const submission = work.submission
    useEffect(() => {
        if (submission === undefined || submission.kind !== "SUBMIT" || isUnsettled(submission)) return
        setHistory((current) =>
            current.some((each) => each.id === submission.id) ? current : [...current, submission],
        )
    }, [submission])
    const usedHints = work.hints.hints.length
    const words: PracticeResultWords = {
        testStatuses: {},
        example: (position) => result("example", { position }),
        hidden: (position) => result("hidden", { position }),
        notRun: result("notRun"),
        running: result("runningTest"),
        accepted: (passed, total) => result("accepted", { passed, total }),
        acceptedUsage: (usage) => result("acceptedUsage", { usage }),
        acceptedHinted: result("acceptedHinted"),
        failedAt: (each, test) => result(`failedAt.${each}`, { test }),
        failedNote: (passed, total) => result("failedNote", { passed, total }),
        compileError: verdict("compileError"),
        compileNote: result("compileNote"),
        pendingTitle: (done, total) => result("pendingTitle", { done, total }),
        pendingQueued: result("pendingQueued"),
        pendingNote: result("pendingNote"),
        runNote: (passed, total) => result("runNote", { passed, total }),
        judgeDown: result("judgeDown"),
        judgeDownNote: result("judgeDownNote"),
    }
    const position = problem === undefined ? -1 : siblings.findIndex((each) => each.slug === problem.slug)
    const viewOf = (each: PracticeProblemView): PracticeSolveView => ({
        title: each.title,
        patternTitle: each.patternTitle,
        patternHref: practicePatternPath(each.patternId),
        meta: [
            difficulty(each.difficulty.toLowerCase()),
            t("limits", { seconds: each.timeLimitMs / 1000, memory: memoryMbOf(each) }),
            usedHints > 0 ? t("hintsOpened", { count: usedHints }) : "",
            position < 0 ? "" : t("position", { position: position + 1, total: siblings.length }),
        ]
            .filter((part) => part !== "")
            .join(" · "),
        markdown: each.statementMarkdown,
        examples: each.examples,
        hintsTotal: each.hintsTotal,
        nextHref: each.nextSlug === null ? null : practiceProblemPath(each.nextSlug),
        isAccepted: each.status === "ACCEPTED" || (submission?.kind === "SUBMIT" && submission.verdict === "ACCEPTED"),
    })
    const isAccepted = problem?.status === "ACCEPTED" || history.some((each) => each.verdict === "ACCEPTED")
    const solutionRevealed = solution !== null || problem?.solutionRevealed === true
    const reveal = async (): Promise<void> => {
        setSolutionFailed(false)
        setConfirmOpen(false)
        try {
            const revealed = await triggerSolution({ slug, locale })
            setSolution(revealed.solution)
            setTab("solution")
        } catch {
            setSolutionFailed(true)
        }
    }
    const openSolution = (): void => {
        setTab("solution")
        if (solutionRevealed) return
        if (isAccepted) void reveal()
        else setConfirmOpen(true)
    }
    return {
        props: {
            slot: mapSlot(slotOfSwr(read), viewOf),
            placeholder: PRACTICE_SOLVE_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("loadFailedTitle") },
            labels: {
                breadcrumbs: t("breadcrumbs"),
                catalog: t("catalog"),
                tabsLabel: t("tabsLabel"),
                tabs: { problem: t("tabs.problem"), submissions: t("tabs.submissions"), solution: t("tabs.solution") },
                run: t("run"),
                submit: t("submit"),
                judging: t("judging"),
                next: t("next"),
                problemTitle: t("problemTitle"),
                editorTitle: t("editorTitle"),
                language: t("language"),
                code: t("code"),
                judgeNote: t("judgeNote"),
                reset: t("reset"),
                examples: t("examples"),
                input: t("input"),
                output: t("output"),
                diagram: t("diagram"),
                diagramError: t("diagramError"),
                hintsTitle: t("hints.title"),
                hintsNote: t("hints.note"),
                hintsReveal: t("hints.reveal"),
                hintsOpen: t("hints.open"),
                hintStep: (step) => t("hints.step", { step }),
                resultTitle: result("title"),
                compileOutput: result("compileOutput"),
                expected: result("expected"),
                actual: result("actual"),
                tests: result("tests"),
                testsEmpty: result("testsEmpty"),
                solutionResultTitle: result("solutionTitle"),
                solutionResultText: result("solutionText"),
                solutionResultAction: t("solutionAction"),
                submissionsTitle: t("submissionsTitle"),
                submissionsEmpty: t("submissionsEmpty"),
                solutionTitle: t("solutionTitle"),
                solutionText: t("solutionText"),
                solutionAction: t("solutionAction"),
                solutionSeenNote: t("solutionSeenNote"),
                solutionFailed: t("solutionFailed"),
                confirmTitle: t("confirmTitle"),
                confirmCancel: t("confirmCancel"),
                confirmAction: t("solutionAction"),
                rateLimited: t("rateLimited"),
                failed: t("failed"),
                hintFailed: t("hintFailed"),
                loadFailedCrumb: t("loadFailedCrumb"),
                loadFailedNote: t("loadFailedNote"),
            },
            state: {
                languages: languageOptions(),
                language: work.draft.language,
                code: work.draft.code,
                issue: work.issue,
                result: resultStateOf(submission, work.isStarting, usedHints, words),
                hints: hintsOf(work.hints.hints),
                hintIssue: work.hints.issue,
                isBusy: work.isBusy,
                isRevealingHint: work.hints.isRevealing,
                tab,
                submissions: history.map((each, index): PracticeSubmissionRow => ({
                    id: each.id,
                    title: t("submissionTitle", { n: index + 1 }),
                    meta: `${verdict(each.verdict === "ACCEPTED" ? "accepted" : "wrongAnswer")} · ${each.passedCount}/${each.totalCount}`,
                    isAccepted: each.verdict === "ACCEPTED",
                })),
                solution,
                isSolutionPending,
                isSolutionFailed,
                isConfirmOpen,
                confirmText: t(usedHints >= (problem?.hintsTotal ?? 3) ? "confirmAllHints" : "confirmSomeHints", {
                    used: usedHints,
                    total: problem?.hintsTotal ?? 3,
                }),
            },
            catalogHref: APP_ROUTES.practice,
        },
        on: {
            retry: () => void read.mutate(),
            selectTab: (value) => setTab(tabOf(value)),
            language: (id) => {
                const next = languageOf(id)
                if (next !== undefined) work.draft.chooseLanguage(next)
            },
            write: work.draft.write,
            reset: work.draft.reset,
            run: work.run,
            submit: work.submit,
            reveal: work.hints.reveal,
            openSolution,
            confirmSolution: () => void reveal(),
            cancelSolution: () => setConfirmOpen(false),
        },
    }
}
