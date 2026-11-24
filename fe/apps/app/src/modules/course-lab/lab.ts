import type {
    LabBody,
    LabBootBody,
    LabOsId,
    LabStageView,
    LabSubmissionView,
    LabSubmitView,
    LabTestView,
    LabWorkBody,
} from "@starci-next/ui"
import type { CourseLabQuery } from "@/modules/api"
import type { CourseLabWords } from "./words"

/** The lab of one lesson as the learner machine last synced it. */
export type CourseLabRead = CourseLabQuery["courseLab"]

/** The boot stages in the order the machine reports them. */
export const BOOT_STAGE_IDS: readonly ["machine", "clone", "compose", "seed", "first-run"] = [
    "machine",
    "clone",
    "compose",
    "seed",
    "first-run",
]

/** The lines of a service log the panel keeps: the last ones. */
const LOG_LINES = 30

/** Where the machine stands for this lab: none paired, paired but off, or online. */
export type CourseLabDevice = "none" | "offline" | "online"

/** How far the lab on the machine is. */
export type CourseLabPhase = "setup" | "booting" | "ready"

/** The device of the read; a value the contract does not name counts as none. */
export const deviceOf = (lab: CourseLabRead): CourseLabDevice => {
    if (lab.device === "offline" || lab.device === "online") return lab.device
    return "none"
}

/** The phase of the read; a value the contract does not name counts as setup. */
export const phaseOf = (lab: CourseLabRead): CourseLabPhase => {
    if (lab.phase === "booting" || lab.phase === "ready") return lab.phase
    return "setup"
}

/** What a page needs to know of the lab to gate its own steps. */
export type CourseLabState = {
    /** True once a machine is paired (online or not). */
    readonly isPaired: boolean
    readonly phase: CourseLabPhase
    /** True when every visible test of the last run passed. */
    readonly isAllGreen: boolean
}

/** True when there is at least one visible test and every one passed in the last run. */
export const isAllGreen = (lab: CourseLabRead): boolean =>
    lab.tests.length > 0 && lab.tests.every((test) => test.passed === true)

/** The summary of a read for the page that gates on it. */
export const stateOf = (lab: CourseLabRead): CourseLabState => ({
    isPaired: deviceOf(lab) !== "none",
    phase: phaseOf(lab),
    isAllGreen: isAllGreen(lab),
})

/** The state before the first read: nothing paired, nothing started, nothing green. */
export const UNREAD_LAB_STATE: CourseLabState = { isPaired: false, phase: "setup", isAllGreen: false }

/** A faulty place of the lab the lesson page points at: a file and its marked lines (a number, or a first and last line). */
export type CourseLabFaulty = {
    readonly file: string
    readonly lines: ReadonlyArray<number | readonly [number, number]>
}

/** Whether a mirrored path is the file a faulty entry names: the same path, or the same file under a folder. */
const isFileOf = (path: string, file: string): boolean => path === file || path.endsWith(`/${file}`)

/** The lines to mark in a file: every faulty entry that names it. */
const marksOf = (path: string, faulty: ReadonlyArray<CourseLabFaulty>) =>
    faulty.filter((each) => isFileOf(path, each.file)).flatMap((each) => each.lines)

/** The extension of a path, for the language badge of the code block. */
const languageOf = (path: string): string => path.slice(path.lastIndexOf(".") + 1)

/** The file the lab opens on: the first faulty file the machine has, else the first file. */
export const defaultPathOf = (lab: CourseLabRead, faulty: ReadonlyArray<CourseLabFaulty>): string => {
    const paths = lab.files.map((file) => file.path)
    const faultyPath = paths.find((path) => faulty.some((each) => isFileOf(path, each.file)))
    return faultyPath ?? paths[0] ?? ""
}

/** The text of a name the lab sends in both languages, in the learner's language. */
const nameOf = (name: { readonly vi: string; readonly en: string }, words: CourseLabWords): string =>
    words.locale === "vi" ? name.vi : name.en

/** One visible test with the result of the last run. */
const testOf = (test: CourseLabRead["tests"][number], words: CourseLabWords): LabTestView => {
    const kind = test.passed === null || test.passed === undefined ? "notRun" : test.passed ? "passed" : "failed"
    const state = kind === "notRun" ? "notRun" : kind === "passed" ? "done" : "error"
    return {
        id: test.id,
        name: nameOf(test.name, words),
        state,
        stateLabel: words.testState(kind),
        duration: test.durationMs === null || test.durationMs === undefined ? "" : words.duration(test.durationMs),
        message: test.message ?? "",
    }
}

/** One boot stage: the one the machine reported, or a waiting one for what it has not reached. */
const stageOf = (id: string, lab: CourseLabRead, words: CourseLabWords): LabStageView => {
    const reported = lab.boot.find((each) => each.stage === id)
    const state = (() => {
        if (reported === undefined) return "waiting" as const
        if (reported.status === "done") return "done" as const
        return reported.status === "failed" ? ("error" as const) : ("running" as const)
    })()
    return {
        id,
        label: words.stage(id),
        state,
        duration: reported === undefined ? "" : words.duration(reported.durationMs),
        detail: reported?.detail ?? "",
    }
}

/** True when a boot stage failed. */
export const hasBootFailed = (lab: CourseLabRead): boolean => lab.boot.some((stage) => stage.status === "failed")

/** What the lab draws while the machine boots. */
const bootBodyOf = (lab: CourseLabRead, machine: string, words: CourseLabWords): LabBootBody => ({
    shape: "boot",
    boot: { machine, stages: BOOT_STAGE_IDS.map((id) => stageOf(id, lab, words)) },
})

/** True while the newest submission waits for the machine to grade it. */
export const isGrading = (lab: CourseLabRead): boolean =>
    lab.latestSubmission?.status === "queued" || lab.latestSubmission?.status === "running"

/** The newest submission, worded; undefined before the first. */
const submissionOf = (lab: CourseLabRead, words: CourseLabWords): LabSubmissionView | undefined => {
    const latest = lab.latestSubmission
    if (latest === null || latest === undefined) return undefined
    const text = words.submit
    if (isGrading(lab))
        return { outcome: "waiting", title: text.waitingTitle, description: text.waitingNote, failedIds: [] }
    if (latest.status === "rejected")
        return {
            outcome: "rejected",
            title: text.rejectedTitle,
            description: text.rejected(latest.rejectReason ?? null),
            failedIds: [],
        }
    if (latest.passed)
        return { outcome: "passed", title: text.passedTitle, description: text.gradedNote, failedIds: [] }
    return {
        outcome: "failed",
        title: text.failedTitle,
        description: text.gradedNote,
        failedIds: latest.tests.filter((test) => !test.passed).map((test) => test.id),
    }
}

/** The submit command: grey with its reason until every visible test is green and the machine is there. */
const submitOf = (lab: CourseLabRead, words: CourseLabWords, isSubmitting: boolean): LabSubmitView => {
    const text = words.submit
    const reason = (() => {
        if (lab.tests.length === 0 || lab.tests.some((test) => test.passed === null || test.passed === undefined))
            return text.reasonNoRun
        if (!isAllGreen(lab)) return text.reasonRed
        return lab.connectionLost ? text.reasonLost : ""
    })()
    return { isDisabled: reason !== "", reason, isPending: isSubmitting || isGrading(lab) }
}

/** What the ready lab needs besides the read: the words, what the learner picked and what is in flight. */
export type CourseLabContext = {
    readonly words: CourseLabWords
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
    readonly faulty: ReadonlyArray<CourseLabFaulty>
    /** The file the learner picked; empty or unknown opens the default one. */
    readonly chosenPath: string
    readonly tab: "tests" | "logs"
    /** The chaos switches that are on, with what the learner just flipped. */
    readonly chaosOn: ReadonlyArray<string>
    readonly isTestRequested: boolean
    readonly isSubmitting: boolean
}

/** What the ready lab draws: header strip, files with the code, tests, logs and the submission. */
const workBodyOf = (lab: CourseLabRead, context: CourseLabContext): LabWorkBody => {
    const { words } = context
    const paths = lab.files.map((file) => file.path)
    const selectedPath = paths.includes(context.chosenPath) ? context.chosenPath : defaultPathOf(lab, context.faulty)
    const file = lab.files.find((each) => each.path === selectedPath)
    const passed = lab.tests.filter((test) => test.passed === true).length
    return {
        shape: "work",
        work: {
            name: lab.courseId,
            branch: lab.lessonId,
            services: lab.logs.length,
            chaos: lab.chaos.map((chaos) => ({
                id: chaos.id,
                label: nameOf(chaos.label, words),
                isOn: context.chaosOn.includes(chaos.id),
            })),
            isRunRequested: context.isTestRequested,
            files: paths,
            selectedPath,
            code:
                file === undefined
                    ? undefined
                    : {
                          path: file.path,
                          language: languageOf(file.path),
                          code: file.text ?? "",
                          highlightLines: marksOf(file.path, context.faulty),
                          isOmitted: file.text === null || file.text === undefined,
                      },
            tests: lab.tests.map((test) => testOf(test, words)),
            testsSummary: words.testsSummary(passed, lab.tests.length),
            logs: lab.logs.map((log) => ({ service: log.service, lines: log.lines.slice(-LOG_LINES) })),
            tab: context.tab,
            lastSynced: lab.lastSyncedAt === null || lab.lastSyncedAt === undefined ? "" : words.time(lab.lastSyncedAt),
        },
        submit: submitOf(lab, words, context.isSubmitting),
        submission: submissionOf(lab, words),
        hasSolution: lab.solutionUnlocked,
    }
}

/** What the pairing steps show. */
export type CourseLabPairing = {
    readonly os: LabOsId
    readonly installCommand: string
    readonly pairCommand: string
    readonly isIssuing: boolean
}

/**
 * What the lab draws: the pairing steps with no machine (or a paired one that is off), the boot stages while the machine starts (or
 * before it has reported any), the ready lab once the first run is done.
 */
export const bodyOf = (lab: CourseLabRead, context: CourseLabContext, pairing: CourseLabPairing): LabBody => {
    const device = deviceOf(lab)
    const phase = phaseOf(lab)
    if (device === "none" || (device === "offline" && phase === "setup")) return { shape: "pair", setup: pairing }
    if (phase === "ready") return workBodyOf(lab, context)
    return bootBodyOf(lab, context.machine, context.words)
}

/** The placeholder of the first read: a ready lab of the same shape with blank words, so the skeleton is the ready tree. */
export const placeholderBodyOf = (): LabBody => ({
    shape: "work",
    work: {
        name: " ".repeat(12),
        branch: " ".repeat(10),
        services: 0,
        chaos: [1, 2].map((index) => ({ id: `placeholder-${index}`, label: " ".repeat(12), isOn: false })),
        isRunRequested: false,
        files: [1, 2, 3].map((index) => `placeholder-${index}`),
        selectedPath: "placeholder-1",
        code: { path: " ".repeat(16), language: "", code: "\n\n\n\n\n\n", highlightLines: [], isOmitted: false },
        tests: [1, 2, 3].map((index) => ({
            id: `placeholder-${index}`,
            name: " ".repeat(30),
            state: "notRun" as const,
            stateLabel: " ".repeat(8),
            duration: "",
            message: "",
        })),
        testsSummary: " ".repeat(10),
        logs: [],
        tab: "tests",
        lastSynced: "",
    },
    submit: { isDisabled: true, reason: "", isPending: false },
    submission: undefined,
    hasSolution: false,
})
