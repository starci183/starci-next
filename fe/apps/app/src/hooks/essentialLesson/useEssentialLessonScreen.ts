"use client"

import { useEffect, useState } from "react"
import { fireConfetti } from "@starci/visual-effects"
import { useLocale } from "next-intl"
import type {
    ApplyPartView,
    BugHuntView,
    PatternPartView,
    ReadingView,
    WrittenCardLabels,
    EssenceLabels,
    EssenceView,
    EssentialPartsLabels,
    LessonEndView,
    LessonRailHead,
    LessonRailStep,
    ScenariosPartView,
    SourcePartView,
} from "@starci-next/ui"
import { navigation } from "@starci-next/i18n/navigation"
import { useSession } from "@/hooks/auth"
import { useLessonAttempts } from "@/hooks/lesson"
import { useLessonProgress } from "@/hooks/lessonProgress"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useGetLessonSwr,
    useGetLessonTopicsSwr,
    useQueryLessonOpenerScoresSwr,
    useQueryLessonPartsProgressSwr,
} from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, signInRedirectHref, topicPath } from "@/modules/routes"
import {
    ESSENTIAL_PARTS,
    type DataSlot,
    type EssentialPart,
    type EssentialView,
    type LessonDifficulty,
    type LessonView,
    type SlotLabels,
} from "@/modules/types"
import { useTranslations } from "next-intl"
import { useLockLabels, type LockLabels } from "./useLockLabels"
import { partOf, partPath, readingChecksOf, type EssentialDesk } from "./essentialLesson.shared"
import { essenceOf, useEssenceLabels, type EssenceShellLabels } from "@/hooks/essence"
import { EMPTY_RUN_PARTS } from "@/modules/essential-runs"
import { useEssentialRuns, type EssentialRuns } from "./useEssentialRuns"
import { useEssentialLessonLabels, type EssentialPageLabels } from "./useEssentialLessonLabels"
import { useFiveParts, type FivePartsLabels } from "./useFiveParts"
import { useLessonCardLabels } from "@/hooks/lessonStudy"
import type { AttemptState } from "@/hooks/lesson"
import type { WrittenDraftView } from "@/modules/types"

/** What the route hands the lesson page: the lesson and the `part` and `scenario` queries. */
type EssentialRoute = {
    readonly lessonId: string
    readonly part: string | undefined
    readonly scenario: string | undefined
}

/** The lesson page as drawn: the band and the part on screen, every word resolved. */
export type EssentialLessonView = {
    readonly id: string
    readonly title: string
    readonly topic: { readonly title: string; readonly href: string }
    /** The crumbs after the catalog (the topic, then the lesson); empty until the lesson is read, so no placeholder word reaches the trail. */
    readonly trail: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href?: string }>
    readonly difficulty: string
    /** The one line under the subtitle: "Caching · 40 phút · 1/5 phần xong" with the figure of the part on screen. */
    readonly facts: string
    /** The lesson's one-line problem, under the title. */
    readonly subtitle: string
    readonly part: EssentialPart
    /** True on the end-of-lesson screen (`?part=end`): no part is current. */
    readonly isEnd: boolean
    /** True when the reader has no Premium (some part is locked). */
    readonly isFree: boolean
    readonly lockedParts: ReadonlyArray<EssentialPart>
    /** The five parts on the rail, each with where the learner stands in it. */
    readonly rail: ReadonlyArray<LessonRailStep>
    /** The head of the rail: the title, its one-line promise and the progress ("1/5 phần · 40 phút"). */
    readonly railHead: LessonRailHead
    /** "Phần 1/5 · Mở đầu · 2/5": the line under the phone bar. */
    readonly railSummary: string
    /** True when the part on screen needs Premium the learner lacks: only its words and the Subscribe link are shown. */
    readonly isLocked: boolean
    /** True when the lesson carries none of the parts yet. */
    readonly hasNoPart: boolean
    readonly essence: EssenceView
    readonly source: SourcePartView
    readonly scenarios: ScenariosPartView
    readonly apply: ApplyPartView
    /** Bản chất: the practice-led reading; undefined for a lesson without one (the part then shows the source). */
    readonly reading: ReadingView | undefined
    /** Tìm sạn: the bug pack; undefined for a lesson without one (the part then shows the scenarios). */
    readonly bugHunt: BugHuntView | undefined
    /** Pattern: the stacks; undefined for a lesson without them. */
    readonly pattern: PatternPartView | undefined
    /** The written explanations the rung on screen asks, by the activity id of the essence question each explains. */
    readonly written: Readonly<Record<string, EssentialWrittenView>>
    /** The end of the lesson, "trước và sau"; undefined until the reader may see it. */
    readonly end: LessonEndView | undefined
    /** The lesson after this one in the topic; undefined for the last. */
    readonly nextLesson: { readonly title: string; readonly href: string } | undefined
}

/** The written explanation an essence question asks (from the Khó rung up), graded by the AI coach. */
export type EssentialWrittenView = {
    readonly activityId: string
    readonly prompt: string
    readonly draft: WrittenDraftView
    /** False until the learner answered the question: the box then waits. */
    readonly isOpen: boolean
}

/** What the learner does on the page. */
export type EssentialLessonActions = {
    readonly retry: () => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly submit: (activityId: string, optionId: string) => void
    /** Picks an option of an opener question and sends it to be graded at once. */
    readonly answer: (activityId: string, optionId: string) => void
    readonly moveOpener: (index: number) => void
    /** Shows the questions or the result of Mở đầu. */
    readonly showStage: (stage: "questions" | "result") => void
    readonly retake: () => void
    readonly selectScenario: (scenarioId: string) => void
    readonly selectChallenge: (challengeId: string) => void
    readonly toggleGuard: (flag: string, isOff: boolean) => void
    readonly revealHint: (scenarioId: string) => void
    /** Opens the next hint of a red Tìm sạn test. */
    readonly openBugHint: (testId: string) => void
    /** Shows one stack of Pattern. */
    readonly selectStack: (stack: string) => void
    /** Holds the text of a written explanation. */
    readonly write: (activityId: string, text: string) => void
    /** Sends a written explanation to be graded. */
    readonly submitWritten: (activityId: string) => void
    readonly openPart: (part: EssentialPart) => void
    /** Opens the end of the lesson ("trước và sau"). */
    readonly openEnd: () => void
    /** Opens the plans page. */
    readonly openPlans: () => void
}

/** The connected lesson page. */
export type EssentialLessonScreen = {
    readonly props: {
        readonly slot: DataSlot<EssentialLessonView>
        readonly placeholder: EssentialLessonView
        readonly slotLabels: SlotLabels
        readonly errorText: string
        readonly page: EssentialPageLabels
        readonly labels: EssentialPartsLabels
        readonly essence: EssenceLabels
        readonly shell: EssenceShellLabels
        /** The three parts that run on the learner machine: their words, the primary command of the part on screen. */
        readonly runs: EssentialRuns
        /** The words of Bản chất, Tìm sạn and Pattern. */
        readonly five: FivePartsLabels
        /** The words of the written explanation card. */
        readonly written: WrittenCardLabels
        /** The words of the part the plan lacks. */
        readonly lock: LockLabels
        /** True for a reader who is not signed in: the locked part then asks to sign in before it asks to upgrade. */
        readonly isGuest: boolean
        /** The sign-in address that brings the reader back to this lesson part. */
        readonly signInHref: string
        readonly plansHref: string
        readonly catalogHref: string
    }
    readonly on: EssentialLessonActions
}

/** The same-shape lesson the skeleton draws while the first read runs. */
export const ESSENTIAL_PLACEHOLDER: EssentialLessonView = {
    id: "placeholder",
    title: "",
    topic: { title: "", href: "/" },
    trail: [],
    difficulty: "",
    facts: "",
    subtitle: "",
    part: "essence",
    isEnd: false,
    isFree: false,
    lockedParts: [],
    rail: ESSENTIAL_PARTS.map((id) => ({ id, title: "", note: "", state: "upcoming" as const, isLocked: false })),
    railSummary: "",
    railHead: { title: "", promise: "", progressLabel: "", progressText: "", progress: 0 },
    hasNoPart: false,
    isLocked: false,
    essence: {
        stage: "questions",
        questions: [
            {
                id: "q",
                prompt: "",
                choices: [1, 2, 3, 4].map((n) => ({ id: `c${n}`, label: "" })),
                pickedId: "",
                correctId: "",
                status: "idle",
                isSendFailed: false,
                isCorrect: false,
                explanation: "",
                links: [],
                misses: [],
                isSolved: false,
                insight: undefined,
                reasons: [],
                event: undefined,
                title: "",
                symptom: "",
                illustration: undefined,
                probe: "",
                contextDiagram: "",
                contextCaption: "",
                steps: [],
                condition: "",
                technical: "",
            },
        ],
        story: undefined,
        isPassed: false,
        index: 0,
        bar: [1, 2, 3, 4, 5].map((n) => ({ id: `q${n}`, label: "", tone: "neutral" as const, isCurrent: false })),
        caption: "",
        resultRows: [],
        solvedFigure: "",
        firstTryFigure: "",
        solvedCount: 0,
        firstTryCount: 0,
        total: 0,
        isFree: false,
        retakeLine: "",
    },
    ...EMPTY_RUN_PARTS,
    reading: undefined,
    bugHunt: undefined,
    pattern: undefined,
    written: {},
    end: undefined,
    nextLesson: undefined,
}

/** The status a written explanation shows: its attempt's, or idle before the first submit. */
const writtenDraftOf = (attempt: AttemptState | undefined, held: string | undefined): WrittenDraftView => {
    const result = attempt?.view?.result
    const isGraded = result !== undefined && result.criteria.length > 0
    const code = attempt?.view?.failureCode ?? ""
    const issueOf = (): WrittenDraftView["issue"] => {
        if (code === "") return "none"
        if (code === "ATTEMPT_COACH_UNCONFIGURED") return "unconfigured"
        return code === "ATTEMPT_COACH_LIMIT_REACHED" ? "limit" : "other"
    }
    return {
        value: held ?? attempt?.view?.answer.text ?? "",
        status: attempt?.status ?? "idle",
        isSendFailed: attempt?.isSendFailed ?? false,
        issue: issueOf(),
        criteria: result?.criteria ?? [],
        scoreLine: isGraded ? `${result.score}/${result.maxScore}` : "",
        scoreShort: isGraded ? `${result.score}/${result.maxScore}` : "",
        isDiagnostic: false,
        savedAt: "",
    }
}

/** The end of the lesson: per essence how the learner answered before reading and which test proved it after, with the three figures. */
const endOf = (
    lesson: LessonView,
    view: EssentialView,
    essence: EssenceView,
    bugHunt: BugHuntView | undefined,
    own: (id: EssentialPart) => { readonly done: number } | undefined,
    shell: EssenceShellLabels,
): LessonEndView => {
    const words = shell.end
    const essenceTests = view.bugs.filter((test) => test.essence !== "")
    const rows = view.opener.map((question, index) => {
        const result = essence.resultRows[index]
        const test = view.bugs.find((each) => each.essence === question.id)
        const bug = bugHunt?.rows.find((each) => each.id === test?.id)
        const isDone = bug?.state === "passed"
        const number = essenceTests.findIndex((each) => each.id === test?.id) + 1
        return {
            id: question.activityId,
            at: question.event?.at ?? "",
            title: test?.title ?? question.prompt,
            before: {
                label: result === undefined || result.isFirstTry ? words.right : words.wrong(result.misses),
                isRight: result === undefined || result.isFirstTry,
            },
            after: { label: isDone ? words.bug(number) : words.pending, isDone },
        }
    })
    const proved = rows.filter((row) => row.after.isDone).length
    return {
        title: words.title(lesson.title),
        summary: words.summary,
        figures: [
            { id: "before", term: words.figureBefore, value: essence.firstTryFigure },
            { id: "after", term: words.figureAfter, value: `${proved}/${rows.length}` },
            {
                id: "level",
                term: words.figureLevel,
                value:
                    view.challenges.length === 0 || (own("apply")?.done ?? 0) === 0
                        ? words.levelNone
                        : `${own("apply")?.done ?? 0}/${view.challenges.length}`,
            },
        ],
        rows,
    }
}

/**
 * The connected four-part lesson page: reads the lesson, the learner's attempts (the opener and the essence checks are choice
 * attempts graded on the spot), the opener's before and after, and the scenario runs the relay brought back from the learner's
 * machine (read again every few seconds while one is in flight), and words every part.
 */
export const useEssentialLessonScreen = (route: EssentialRoute): EssentialLessonScreen => {
    const locale = useLocale()
    const tStudy = useTranslations("app.essentials")
    const router = navigation.useRouter()
    const read = useGetLessonSwr(route.lessonId, locale)
    const { progress, refresh } = useLessonProgress(route.lessonId, locale)
    const restored = Object.fromEntries((progress?.activities ?? []).map((each) => [each.activityId, each.latest]))
    const attempts = useLessonAttempts(restored)
    const scores = useQueryLessonOpenerScoresSwr([route.lessonId])
    const isEnd = route.part === "end"
    // The end of the lesson stands on the last part's data; its own address is `?part=end`.
    const part = isEnd ? "pattern" : partOf(route.part)
    const { page, parts } = useEssentialLessonLabels()
    const { labels: essenceLabels, words: essenceWords, shell } = useEssenceLabels()
    const standing = useQueryLessonPartsProgressSwr([route.lessonId]).data?.[route.lessonId]
    const topicId = read.data?.topic.id
    const topic = useGetLessonTopicsSwr(topicId === undefined ? [] : [topicId], locale).data?.[topicId ?? ""]
    const slotLabels = useSlotLabels()
    const lock = useLockLabels()
    const session = useSession()
    const here = read.data === undefined ? APP_ROUTES.essentials : partPath(read.data, part)
    const [desk, setDesk] = useState<EssentialDesk>({
        picks: {},
        retakeFrom: {},
        openerIndex: undefined,
        stage: undefined,
    })
    const [writing, setWriting] = useState<Readonly<Record<string, string>>>({})
    const cards = useLessonCardLabels()
    const tFive = useTranslations("app.essentials.essential.five")
    const runsPart = useEssentialRuns({
        lesson: read.data,
        part,
        scenario: route.scenario,
        refreshLesson: () => void read.mutate(),
        attempts: attempts.attempts,
        picks: desk.picks,
    })
    const five = useFiveParts({
        lesson: read.data,
        // The end of the lesson lists each essence's test, so it reads the bug results like Tìm sạn does.
        part: isEnd ? "scenarios" : part,
        locale,
        score: scores.data?.[route.lessonId],
        machine: runsPart.source.machine.isOnline ? runsPart.source.machine.name : "",
        runs: runsPart.runs,
    })
    const settled = Object.values(attempts.attempts)
        .map((attempt) => `${attempt.view?.attemptId ?? ""}:${attempt.status}`)
        .join(",")
    const rescore = scores.mutate
    useEffect(() => {
        refresh()
        void rescore()
    }, [settled, refresh, rescore])
    useEffect(() => {
        if (route.scenario !== undefined) setDesk((all) => ({ ...all, scenarioId: route.scenario ?? "" }))
    }, [route.scenario])
    useDocumentTitle(read.data?.title)
    const difficulty = {
        foundation: tStudy("difficulty.foundation"),
        intermediate: tStudy("difficulty.intermediate"),
        advanced: tStudy("difficulty.advanced"),
    } satisfies Record<LessonDifficulty, string>
    const score = scores.data?.[route.lessonId]
    return {
        props: {
            slot: mapSlot(slotOfSwr(read), (lesson): EssentialLessonView => {
                const view: EssentialView = lesson.essential ?? {
                    isLocked: !lesson.isPremium,
                    lockedParts: [],
                    story: undefined,
                    opener: [],
                    source: undefined,
                    invariants: [],
                    architecture: undefined,
                    codeWalk: [],
                    scenarios: [],
                    challenges: [],
                    bugs: [],
                    patterns: [],
                    reading: undefined,
                }
                const essence = essenceOf({
                    lesson,
                    essential: view,
                    attempts: attempts.attempts,
                    desk,
                    score,
                    words: essenceWords,
                })
                const place = topic?.path.findIndex((each) => each.lessonId === lesson.id) ?? -1
                const own = (id: EssentialPart) => standing?.parts.find((each) => each.part === id)
                const stateOf = (id: EssentialPart): "none" | "doing" | "done" | "locked" =>
                    view.lockedParts.includes(id) ? "locked" : (own(id)?.state ?? "none")
                const doneCount = ESSENTIAL_PARTS.filter((id) => stateOf(id) === "done").length
                const rung = view.challenges.find((each) => each.id === runsPart.apply.challenge?.id)
                const written = Object.fromEntries(
                    (rung?.questions ?? [])
                        .filter((question) => question.writtenActivityId !== "")
                        .map((question): [string, EssentialWrittenView] => [
                            question.activityId,
                            {
                                activityId: question.writtenActivityId,
                                prompt: tFive("written.prompt"),
                                draft: writtenDraftOf(
                                    attempts.attempts[question.writtenActivityId],
                                    writing[question.writtenActivityId],
                                ),
                                isOpen: attempts.attempts[question.activityId]?.status === "graded",
                            },
                        ]),
                )
                const noteOf = (id: EssentialPart): string => {
                    const words = shell.rail
                    if (stateOf(id) === "locked") return words.premium
                    const standingOf = own(id)
                    if (id === "essence")
                        return stateOf(id) === "done"
                            ? words.questionsDone(essence.questions.length, score?.firstCorrect ?? 0)
                            : words.questions(
                                  essence.questions.filter((question) => question.isSolved).length,
                                  essence.questions.length,
                              )
                    if (id === "source") return stateOf(id) === "done" ? words.readingDone : words.readingNote
                    if (id === "scenarios") {
                        const tests = view.bugs.length
                        return standingOf !== undefined && standingOf.done > 0
                            ? words.bugsProgress(standingOf.done, tests)
                            : words.bugsNote(view.bugs.filter((test) => test.essence !== "").length, tests)
                    }
                    if (id === "apply")
                        return standingOf !== undefined && standingOf.done > 0
                            ? words.applyProgress(standingOf.done, view.challenges.length)
                            : words.applyNote
                    return stateOf(id) === "done" ? words.patternDone : words.patternNote
                }
                const rail = ESSENTIAL_PARTS.map((id): LessonRailStep => ({
                    id,
                    title: page.parts[id],
                    note: noteOf(id),
                    isLocked: stateOf(id) === "locked",
                    state: id === part && !isEnd ? "current" : stateOf(id) === "done" ? "complete" : "upcoming",
                }))
                const position = ESSENTIAL_PARTS.indexOf(part) + 1
                const extra =
                    part === "scenarios" && five.bugHunt !== undefined
                        ? shell.metaBugs(five.bugHunt.passed, five.bugHunt.total)
                        : part === "apply" && view.challenges.length > 0
                          ? shell.metaApply(own("apply")?.done ?? 0, view.challenges.length)
                          : ""
                const next = place === -1 ? undefined : topic?.path[place + 1]
                const end: LessonEndView | undefined = isEnd
                    ? endOf(lesson, view, essence, five.bugHunt, own, shell)
                    : undefined
                return {
                    id: lesson.id,
                    title: lesson.title,
                    topic: { title: lesson.topic.title, href: topicPath(lesson.topic.id) },
                    trail: [
                        { id: "topic", label: lesson.topic.title, href: topicPath(lesson.topic.id) },
                        { id: "lesson", label: lesson.title },
                    ],
                    difficulty: difficulty[lesson.difficulty],
                    facts: [shell.meta(lesson.topic.title, lesson.minutes, doneCount, ESSENTIAL_PARTS.length), extra]
                        .filter((each) => each !== "")
                        .join(" · "),
                    subtitle: lesson.description,
                    isFree: view.lockedParts.length > 0,
                    lockedParts: view.lockedParts,
                    part,
                    isEnd,
                    rail,
                    railSummary: shell.rail.summary(position, ESSENTIAL_PARTS.length, page.parts[part], noteOf(part)),
                    railHead: {
                        title: lesson.title,
                        promise: lesson.description,
                        progressLabel: shell.rail.progress,
                        progressText: shell.rail.progressText(doneCount, ESSENTIAL_PARTS.length, lesson.minutes),
                        progress: Math.round((doneCount / ESSENTIAL_PARTS.length) * 100),
                    },
                    hasNoPart: lesson.essential === undefined,
                    isLocked: lesson.essential !== undefined && view.lockedParts.includes(part),
                    essence,
                    source: runsPart.source,
                    scenarios: runsPart.scenarios,
                    apply: runsPart.apply,
                    reading:
                        five.reading === undefined
                            ? undefined
                            : { ...five.reading, checks: readingChecksOf(lesson, attempts.attempts, desk) },
                    bugHunt: five.bugHunt,
                    pattern: five.pattern,
                    written,
                    end,
                    nextLesson:
                        next === undefined
                            ? undefined
                            : {
                                  title: next.title,
                                  href: `${topicPath(lesson.topic.id)}/${encodeURIComponent(next.lessonId)}`,
                              },
                }
            }),
            placeholder: ESSENTIAL_PLACEHOLDER,
            slotLabels: { ...slotLabels(page.empty), error: page.errorTitle },
            errorText: page.errorText,
            page,
            labels: parts,
            essence: essenceLabels,
            shell,
            runs: runsPart,
            five: five.labels,
            written: cards.written,
            lock,
            isGuest: session.status === "signed-out",
            signInHref: signInRedirectHref(APP_ROUTES.signIn, here),
            plansHref: APP_ROUTES.premium,
            catalogHref: APP_ROUTES.essentials,
        },
        on: {
            retry: () => void read.mutate(),
            pick: (activityId, optionId) =>
                setDesk((all) => ({ ...all, picks: { ...all.picks, [activityId]: optionId } })),
            submit: (activityId, optionId) => {
                if (optionId === "" || read.data === undefined) return
                attempts.submit({
                    lessonId: route.lessonId,
                    version: read.data.version,
                    locale,
                    activityId,
                    answer: { optionId },
                })
            },
            answer: (activityId, optionId) => {
                const place = (read.data?.essential?.opener ?? []).findIndex((each) => each.activityId === activityId)
                setDesk((all) => ({
                    ...all,
                    picks: { ...all.picks, [activityId]: optionId },
                    openerIndex: place === -1 ? all.openerIndex : place,
                }))
                if (optionId === "" || read.data === undefined) return
                attempts.submit(
                    {
                        lessonId: route.lessonId,
                        version: read.data.version,
                        locale,
                        activityId,
                        answer: { optionId },
                    },
                    (view) => {
                        // The right pick of an opener question is celebrated the moment its grade lands.
                        if (place !== -1 && view.result?.correct === true) fireConfetti()
                    },
                )
            },
            moveOpener: (index) => setDesk((all) => ({ ...all, openerIndex: index, stage: "questions" })),
            showStage: (stage) => setDesk((all) => ({ ...all, stage })),
            retake: () => {
                const opener = read.data?.essential?.opener ?? []
                setDesk((all) => ({
                    ...all,
                    openerIndex: 0,
                    stage: "questions",
                    picks: Object.fromEntries(
                        Object.entries(all.picks).filter(([id]) => !opener.some((each) => each.activityId === id)),
                    ),
                    retakeFrom: Object.fromEntries(
                        opener.map((each) => [each.activityId, attempts.attempts[each.activityId]?.revision ?? 0]),
                    ),
                }))
            },
            ...runsPart.on,
            openBugHint: five.on.openBugHint,
            selectStack: five.on.selectStack,
            write: (activityId, text) => setWriting((all) => ({ ...all, [activityId]: text })),
            submitWritten: (activityId) => {
                const text = writing[activityId] ?? ""
                if (text.trim() === "" || read.data === undefined) return
                attempts.submit({
                    lessonId: route.lessonId,
                    version: read.data.version,
                    locale,
                    activityId,
                    answer: { text },
                })
            },
            openPlans: () => router.push(APP_ROUTES.premium),
            openPart: (target) => {
                if (read.data !== undefined) router.push(partPath(read.data, target))
            },
            openEnd: () => {
                if (read.data !== undefined) router.push(partPath(read.data, "end"))
            },
        },
    }
}
