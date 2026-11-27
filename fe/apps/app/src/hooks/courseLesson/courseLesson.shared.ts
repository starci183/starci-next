import type {
    CourseArchitectureLabels,
    CourseArchitectureView,
    CourseCaseLoopLabels,
    CourseCaseLoopView,
    CourseIntroLabels,
    CourseIntroLabView,
    CourseIntroView,
    CoursePatternLabels,
    CoursePatternView,
    CourseProductionLabels,
    CourseProductionView,
    DataSlot,
    SlotLabels,
} from "@starci-next/ui"
import {
    architectureViewOf,
    caseResultOf,
    hintsOpenedOf,
    introLabViewOf,
    introViewOf,
    isEverGreen,
    isGreenNow,
    loopViewOf,
    localized,
    missingCountOf,
    notGreenNowCountOf,
    pageAfter,
    patternViewOf,
    PLACEHOLDER_ARCHITECTURE,
    productionViewOf,
    type CourseCase,
    type CourseLessonRecord,
    type CourseLoopWords,
    type CoursePage,
    type LabCaseResult,
} from "@/modules/course-lesson"
import type { CourseRead } from "@/hooks/swr"
import { staticsBase } from "@/modules/config"
import type { CourseHintFailure, CourseHints } from "./useCourseHints"
import type { CoursePageLabels } from "./useCoursePageLabels"
import type { CourseNoticeWords, CourseShellLabels } from "./useCourseShellLabels"

/** What the route hands the lesson page: the lesson in the address and the raw `page` and `case` queries. */
export type CourseLessonRoute = {
    readonly courseId: string
    readonly lessonId: string
    readonly page: string | undefined
    readonly caseId: string | undefined
}

/** A notice above the page body: what is the case and the one way out of it, to a page of the lesson or to the plans. */
export type CourseNoticeView = {
    readonly title: string
    readonly text: string
    readonly action:
        | { readonly label: string; readonly page: CoursePage | undefined; readonly caseId: string | undefined }
        | undefined
    /** True when the way out is the plans page. */
    readonly isPlans: boolean
}

/** The lesson's title from the catalog in the learner's language; the lab's name while the catalog says none. */
const catalogTitleOf = (params: CourseViewParams): string => {
    const entry = params.course?.lessons.find((each) => each.lessonId === params.route.lessonId)
    return entry === undefined ? params.shell.title(params.lesson.lab) : localized(entry.title, params.locale)
}

/**
 * The title of the page. The first four pages must not name the lesson's concept (the REF rule: the learner has not met it yet), and the
 * catalog's title may, so they carry the title the record's hook gives (a plain-words title of the situation); the naming and submit pages
 * carry the catalog's. A record with no hook title falls back to the catalog's.
 */
const lessonTitleOf = (params: CourseViewParams): string => {
    const hookTitle = params.lesson.hook?.title
    const isBeforeNaming = params.route.page !== "pattern" && params.route.page !== "submit"
    if (isBeforeNaming && hookTitle !== undefined && hookTitle !== null) return localized(hookTitle, params.locale)
    return catalogTitleOf(params)
}

/** The lesson as the page draws it: the band, the pages' views and what the lab panel beside a loop is handed. */
export type CourseLessonView = {
    readonly lessonId: string
    /** The lab the lesson belongs to; empty until the lesson is read. */
    readonly courseId: string
    /** The course the lesson belongs to, in the learner's language; empty until the catalog is read. */
    readonly courseTitle: string
    readonly page: CoursePage
    readonly title: string
    readonly description: string
    /** The one meta line of the band: the services, the cases and how many are green. */
    readonly meta: string
    /** The command that goes on from this page; undefined on the last page. */
    readonly next: { readonly label: string; readonly page: CoursePage } | undefined
    /** What this page says when it is reached before the one it needs; undefined when nothing is missing. */
    readonly missing: CourseNoticeView | undefined
    /** Why the last hint did not open; undefined when none failed. */
    readonly hintNotice: CourseNoticeView | undefined
    readonly intro: CourseIntroView
    /** The lab card beside the intro: the passed figure, the first cases and the start command. */
    readonly introLab: CourseIntroLabView
    /** The loop of the page on screen: its cases and the selected one in detail. */
    readonly loop: CourseCaseLoopView
    readonly loopKind: "happy" | "unhappy"
    readonly pattern: CoursePatternView
    /** The static Kiến trúc page: the same for every learner, built from the record alone. */
    readonly architecture: CourseArchitectureView
    /** The comparison with real repositories; undefined until the learner's code passed, or when the record lists none. */
    readonly production: CourseProductionView | undefined
    readonly setupLead: string
    /** The current case as the lab panel beside the loop is handed it. */
    readonly caseResult: LabCaseResult | undefined
    /** The learner's files the lab panel opens on, each with the lines the selected case checks (its `focus`) marked. */
    readonly faulty: ReadonlyArray<{ readonly file: string; readonly lines: ReadonlyArray<number> }>
    readonly hintsOpened: number
    readonly timeSpentMs: number
}

/** What the learner does on the page. */
export type CourseLessonActions = {
    readonly retry: () => void
    /** Opens a page of the lesson, optionally on one case. */
    readonly openPage: (page: CoursePage, caseId?: string) => void
    readonly selectCase: (caseId: string) => void
    readonly openHint: (caseId: string, level: number) => void
    readonly dismissHint: () => void
    readonly openPlans: () => void
}

/** The words the block draws with. */
export type CourseLessonBlockLabels = {
    readonly breadcrumbs: string
    readonly essentials: string
    readonly tabsLabel: string
    readonly pages: Readonly<Record<CoursePage, string>>
    /** The seven pages as the header's tabs, in order. */
    readonly pageTabs: ReadonlyArray<{ readonly id: CoursePage; readonly label: string }>
    readonly upgrade: string
    readonly dismiss: string
    readonly intro: CourseIntroLabels
    readonly pattern: CoursePatternLabels
    readonly architecture: CourseArchitectureLabels
    readonly production: CourseProductionLabels
    /** The labels of the loop on screen. */
    readonly loop: CourseCaseLoopLabels
    readonly signIn: string
    /** What the notice says to a reader who may not see the lesson. */
    readonly forbidden: string
}

/** The connected lesson page. */
export type CourseLessonScreen = {
    readonly props: {
        readonly slot: DataSlot<CourseLessonView>
        readonly placeholder: CourseLessonView
        readonly slotLabels: SlotLabels
        readonly errorText: string
        readonly labels: CourseLessonBlockLabels
        readonly catalogHref: string
        readonly plansHref: string
        /** True for a reader who is not signed in: the lesson then asks to sign in before anything else. */
        readonly isGuest: boolean
        readonly signInHref: string
    }
    readonly on: CourseLessonActions
}

/** A notice from its words and the way out: a page of the lesson, optionally on one case. */
const noticeOf = (words: CourseNoticeWords, page: CoursePage | undefined, caseId?: string): CourseNoticeView => ({
    title: words.title,
    text: words.text,
    action: page === undefined ? undefined : { label: words.action, page, caseId },
    isPlans: false,
})

/** The first case of the lesson, in the order of the loops, that is not green yet. */
const firstOpenOf = (cases: ReadonlyArray<CourseCase>, kind?: "happy" | "unhappy"): CourseCase | undefined =>
    cases.find((each) => (kind === undefined || each.kind === kind) && !isEverGreen(each))

/**
 * What a page says when it is reached before the one it needs. The page stays readable: this only names what is missing and the way
 * back to it. The intro and the setup need nothing; the loops, the naming and the submission need the page before them.
 */
const missingOf = (
    page: CoursePage,
    cases: ReadonlyArray<CourseCase>,
    labPhase: string | undefined,
    shell: CourseShellLabels,
): CourseNoticeView | undefined => {
    if (page === "happy" && labPhase !== undefined && labPhase !== "ready") {
        return noticeOf(shell.missing.setup, "setup")
    }
    if (page === "unhappy" && missingCountOf(cases, "happy") > 0) {
        return noticeOf(shell.missing.happy(missingCountOf(cases, "happy")), "happy", firstOpenOf(cases, "happy")?.id)
    }
    if (page === "pattern" && missingCountOf(cases, "unhappy") > 0) {
        return noticeOf(
            shell.missing.unhappy(missingCountOf(cases, "unhappy")),
            "unhappy",
            firstOpenOf(cases, "unhappy")?.id,
        )
    }
    // The submission reads the newest run of every case, as the server's gate does: a case green once and red since blocks it too.
    const next = cases.find((each) => !isGreenNow(each))
    if (page === "submit" && next !== undefined) {
        return noticeOf(shell.missing.submit(notGreenNowCountOf(cases)), next.kind, next.id)
    }
    return undefined
}

/** The notice of a hint that did not open: the plan lacks it (with the way to the plans) or it failed for another reason. */
const hintNoticeOf = (
    failure: CourseHintFailure | undefined,
    shell: CourseShellLabels,
): CourseNoticeView | undefined => {
    if (failure === undefined) return undefined
    if (failure === "other") return noticeOf(shell.hintFailure.other, undefined)
    const { premium } = shell.hintFailure
    return {
        title: premium.title,
        text: premium.text,
        action: { label: premium.action, page: undefined, caseId: undefined },
        isPlans: true,
    }
}

/**
 * The learner files the lab panel opens on, each with the lines the selected case checks marked (the case's `focus`, lessons.md §3): the
 * files the record's architecture lists, else the one learner file. No case selected, or a case without focus, marks nothing.
 */
export const faultyOf = (
    lesson: CourseLessonRecord,
    selected: CourseCase | undefined,
): ReadonlyArray<{ readonly file: string; readonly lines: ReadonlyArray<number> }> => {
    const files = lesson.architecture?.files.map((each) => each.path) ?? []
    const paths = files.length === 0 ? [lesson.learnerFile] : files
    const focus = selected?.spec.focus ?? null
    const withFocus = focus === null || paths.includes(focus.file) ? paths : [...paths, focus.file]
    return withFocus.map((file) => ({ file, lines: focus !== null && focus.file === file ? focus.lines : [] }))
}

/** What the view of the lesson is built from. */
export type CourseViewParams = {
    readonly route: { readonly lessonId: string; readonly page: CoursePage; readonly caseId: string | undefined }
    readonly lesson: CourseLessonRecord
    readonly course: CourseRead | undefined
    readonly cases: ReadonlyArray<CourseCase>
    readonly locale: string
    readonly labPhase: string | undefined
    /** True when the newest submission of the learner's code passed the hidden grader. */
    readonly isPassed: boolean
    readonly hints: CourseHints
    readonly spentMs: number
    readonly shell: CourseShellLabels
    readonly loopWords: CourseLoopWords
    readonly pages: CoursePageLabels
}

/** The lesson as the page draws it: the band, the view of each page and what the lab panel beside a loop is handed. */
export const viewOf = (params: CourseViewParams): CourseLessonView => {
    const { route, lesson, cases, locale, shell, pages } = params
    const kind = route.page === "happy" ? "happy" : "unhappy"
    const selected = cases.find((each) => each.kind === kind && each.id === route.caseId)
    const isLoop = route.page === "happy" || route.page === "unhappy"
    const next = shell.next[route.page]
    return {
        lessonId: route.lessonId,
        courseId: lesson.lab,
        page: route.page,
        courseTitle: params.course === undefined ? "" : localized(params.course.title, locale),
        title: lessonTitleOf(params),
        description: route.page === "intro" ? shell.description(cases.length) : "",
        meta: shell.meta({
            services: lesson.stack.services.length,
            happy: lesson.happy.length,
            unhappy: lesson.unhappy.length,
            green: cases.filter(isGreenNow).length,
            total: cases.length,
        }),
        next: next === undefined ? undefined : { label: next, page: pageAfter(route.page) ?? route.page },
        missing: missingOf(route.page, cases, params.labPhase, shell),
        hintNotice: hintNoticeOf(params.hints.failure, shell),
        intro: introViewOf(lesson, pages.intro.words, locale, staticsBase(), lessonTitleOf(params)),
        introLab: introLabViewOf(lesson, cases, pages.intro.words, params.loopWords.status, locale),
        loop: loopViewOf({
            lesson,
            cases,
            kind,
            selectedId: route.caseId,
            locale,
            words: params.loopWords,
            opened: params.hints.opened,
            opening: params.hints.opening,
        }),
        loopKind: kind,
        pattern: patternViewOf(lesson, cases, pages.pattern.words, locale),
        architecture: architectureViewOf(lesson, pages.architecture.words, locale),
        production:
            route.page === "submit" && params.isPassed
                ? productionViewOf(lesson, pages.production.words, locale)
                : undefined,
        setupLead: shell.setupLead,
        caseResult: isLoop ? caseResultOf(lesson, selected, locale) : undefined,
        faulty: faultyOf(lesson, isLoop ? selected : undefined),
        hintsOpened: hintsOpenedOf(cases),
        timeSpentMs: params.spentMs,
    }
}

/** The smallest drawing the diagram accepts; the skeleton of the first read shows it unseen. */
const PLACEHOLDER_DIAGRAM = ["flowchart LR", "    a[ ]"].join("\n")

/** A blank lesson of the same shape as a read one: the skeleton of the first read draws from it, so no placeholder word reaches the screen. */
export const PLACEHOLDER_VIEW: CourseLessonView = {
    lessonId: "",
    courseId: "",
    courseTitle: "",
    page: "intro",
    title: "",
    description: "",
    meta: "",
    next: undefined,
    missing: undefined,
    hintNotice: undefined,
    intro: {
        explainer: undefined,
        hook: undefined,
        diagram: PLACEHOLDER_DIAGRAM,
        services: [1, 2, 3].map((n) => ({ id: `service-${n}`, title: "", description: "" })),
        outcomes: [1, 2, 3].map((n) => ({ id: `outcome-${n}`, can: "", caseTitle: "" })),
        requires: [],
    },
    introLab: {
        title: "",
        figure: "",
        percent: 0,
        meta: "",
        rows: [1, 2, 3].map((n) => ({ id: `case-${n}`, title: "", status: "open" as const, statusLabel: "" })),
        more: "",
        start: "",
        caption: "",
    },
    loop: {
        intro: "",
        progress: "",
        cases: [1, 2, 3].map((n) => ({
            id: `case-${n}`,
            title: "",
            status: "open" as const,
            statusLabel: "",
            isSelected: false,
        })),
        selected: undefined,
        mcp: undefined,
    },
    loopKind: "happy",
    pattern: {
        lead: "",
        retell: [],
        steps: [1, 2, 3].map((n) => ({
            id: `step-${n}`,
            question: "",
            did: "",
            gain: "",
            englishName: "",
            isGreen: false,
            stateLabel: "",
        })),
    },
    architecture: PLACEHOLDER_ARCHITECTURE,
    production: undefined,
    setupLead: "",
    caseResult: undefined,
    faulty: [],
    hintsOpened: 0,
    timeSpentMs: 0,
}
