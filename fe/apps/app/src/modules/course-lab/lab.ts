import type {
    LabBody,
    LabBootView,
    LabCaseResultView,
    LabCaseState,
    LabMatrixView,
    LabOsId,
    LabSetupBody,
    LabStageView,
    LabSubmissionView,
    LabSubmitBody,
    LabSubmitView,
    LabWorkBody,
} from "@starci-next/ui"
import type { CourseCasesQuery, CourseLabQuery } from "@/modules/api"
import type { CourseLabWords } from "./words"

/** The lab of one lesson as the learner machine last synced it. */
export type CourseLabRead = CourseLabQuery["courseLab"]

/**
 * Where the learner stands in each case (the `courseCases` read). The submit gate reads these, not the lab's `tests`: a lab@2 lab records
 * its runs per case, so `tests` stays empty while every case is green.
 */
export type CourseLabCases = CourseCasesQuery["courseCases"]["cases"]

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

/** The longest folder text the relay takes, the same bound as its own check. */
const DIR_MAX = 260

/** Where the machine stands for this lab: none paired, paired but off, or online. */
export type CourseLabDevice = "none" | "offline" | "online"

/** How far the lab on the machine is. */
export type CourseLabPhase = "setup" | "booting" | "ready"

/** The part of the lab a page shows: the setup page, the lab column of a loop page, or the submit page. */
export type CourseLabStage = "setup" | "work" | "submit"

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
    /** True when every happy and unhappy case is green. */
    readonly isAllGreen: boolean
}

/** True when the lab has cases and every one is green: the same rule the server checks before it accepts a submission. */
export const isAllGreen = (cases: CourseLabCases | undefined): boolean =>
    cases !== undefined && cases.length > 0 && cases.every((each) => each.status === "green")

/** The summary of a read for the page that gates on it. */
export const stateOf = (lab: CourseLabRead, cases: CourseLabCases | undefined): CourseLabState => ({
    isPaired: deviceOf(lab) !== "none",
    phase: phaseOf(lab),
    isAllGreen: isAllGreen(cases),
})

/** The state before the first read: nothing paired, nothing started, nothing green. */
export const UNREAD_LAB_STATE: CourseLabState = { isPaired: false, phase: "setup", isAllGreen: false }

/** The folder a lab goes in when the learner types none: `~/starci/<course>/<lesson>`. */
export const defaultDirOf = (courseId: string, lessonId: string): string => `~/starci/${courseId}/${lessonId}`

/** True when a folder text can go to the relay: not blank, within the bound and a single line. */
export const isDirValid = (dir: string): boolean => dir.trim() !== "" && dir.length <= DIR_MAX && !/\p{Cc}/u.test(dir)

/** A faulty place of the lab the lesson page points at: a file and its marked lines (a number, or a first and last line). */
export type CourseLabFaulty = {
    readonly file: string
    readonly lines: ReadonlyArray<number | readonly [number, number]>
}

/** The current case, which the page passes in: its title, where it stands and, when red, the invariant that failed with what was expected and found. */
export type CourseLabCaseResult = {
    readonly title: string
    readonly status: LabCaseState
    readonly invariant: string
    readonly expected: string
    readonly actual: string
}

/** Whether a mirrored path is the file a name points at: the same path, or the same file under a folder. */
const isFileOf = (path: string, file: string): boolean => path === file || path.endsWith(`/${file}`)

/** The lines to mark in a file: every faulty entry that names it. */
const marksOf = (path: string, faulty: ReadonlyArray<CourseLabFaulty>) =>
    faulty.filter((each) => isFileOf(path, each.file)).flatMap((each) => each.lines)

/** The extension of a path, for the language badge of the code block. */
const languageOf = (path: string): string => path.slice(path.lastIndexOf(".") + 1)

/** The file the lab opens on: the ONE learner file when the machine has it, else the first faulty file, else the first file. */
export const defaultPathOf = (lab: CourseLabRead, faulty: ReadonlyArray<CourseLabFaulty>): string => {
    const paths = lab.files.map((file) => file.path)
    const learner = lab.learnerFile ?? undefined
    const learnerPath = learner === undefined ? undefined : paths.find((path) => isFileOf(path, learner))
    const faultyPath = paths.find((path) => faulty.some((each) => isFileOf(path, each.file)))
    return learnerPath ?? faultyPath ?? paths[0] ?? ""
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

/**
 * The boot of a run the machine has not reported yet: every stage waiting, or, once the learner pressed start, the first one running. The
 * last run's times never stand in for this one's.
 */
const freshBootOf = (machine: string, words: CourseLabWords, isStarting: boolean): LabBootView => ({
    machine,
    stages: BOOT_STAGE_IDS.map((id, index) => ({
        id,
        label: words.stage(id),
        state: isStarting && index === 0 ? ("running" as const) : ("waiting" as const),
        duration: "",
        detail: "",
    })),
})

/** True when a boot stage failed. */
export const hasBootFailed = (lab: CourseLabRead): boolean => lab.boot.some((stage) => stage.status === "failed")

/** The boot progress: every stage in order, with the machine it runs on. */
const bootOf = (lab: CourseLabRead, machine: string, words: CourseLabWords): LabBootView => ({
    machine,
    stages: BOOT_STAGE_IDS.map((id) => stageOf(id, lab, words)),
})

/** True while the newest submission waits for the machine to grade it. */
export const isGrading = (lab: CourseLabRead): boolean =>
    lab.latestSubmission?.status === "queued" || lab.latestSubmission?.status === "running"

/** The id of the hidden test of one matrix cell: the step, a dash, the fault. */
const cellIdOf = (step: string, fault: string): string => `${step}-${fault}`

/** The words of one hidden cell that failed (the step, a cross, the fault), or its own id when the matrix does not hold it. */
const cellNameOf = (id: string, lab: CourseLabRead, words: CourseLabWords): string => {
    const matrix = lab.matrix
    const cell = (matrix?.steps ?? [])
        .flatMap((step) => (matrix?.faults ?? []).map((fault) => ({ step, fault })))
        .find((each) => cellIdOf(each.step, each.fault) === id)
    return cell === undefined ? id : `${words.step(cell.step)} × ${words.fault(cell.fault)}`
}

/** What a matrix cell stands at: its verdict once graded, else running while the machine grades, else waiting. */
const cellKindOf = (
    verdict: boolean | undefined,
    isGradingNow: boolean,
): "passed" | "failed" | "running" | "waiting" => {
    if (verdict !== undefined) return verdict ? "passed" : "failed"
    return isGradingNow ? "running" : "waiting"
}

/** The status mark of a matrix cell kind. */
const MARK_OF_CELL = { passed: "done", failed: "error", running: "running", waiting: "waiting" } as const

/** The hidden grader matrix with the verdict of each cell of the newest graded submission; every cell waits before one is graded. */
const matrixOf = (lab: CourseLabRead, words: CourseLabWords): LabMatrixView | undefined => {
    const matrix = lab.matrix
    if (matrix === null || matrix === undefined) return undefined
    const verdicts = new Map((lab.latestSubmission?.tests ?? []).map((test) => [test.id, test.passed]))
    const grading = isGrading(lab)
    const cells = matrix.steps.length * matrix.faults.length
    const passed = [...verdicts.values()].filter(Boolean).length
    return {
        faults: matrix.faults.map((fault) => ({ id: fault, label: words.fault(fault) })),
        rows: matrix.steps.map((step) => ({
            id: step,
            label: words.step(step),
            cells: matrix.faults.map((fault) => {
                const id = cellIdOf(step, fault)
                const kind = cellKindOf(verdicts.get(id), grading)
                return { id, state: MARK_OF_CELL[kind], stateLabel: words.cell(kind) }
            }),
        })),
        score: verdicts.size === 0 ? "" : words.submit.score(passed, cells),
    }
}

/** The newest submission, worded; undefined before the first. */
const submissionOf = (lab: CourseLabRead, words: CourseLabWords): LabSubmissionView | undefined => {
    const latest = lab.latestSubmission
    if (latest === null || latest === undefined) return undefined
    const text = words.submit
    if (isGrading(lab))
        return { outcome: "waiting", title: text.waitingTitle, description: text.waitingNote, failed: [] }
    if (latest.status === "rejected")
        return {
            outcome: "rejected",
            title: text.rejectedTitle,
            description: text.rejected(latest.rejectReason ?? null),
            failed: [],
        }
    if (latest.passed) return { outcome: "passed", title: text.passedTitle, description: text.gradedNote, failed: [] }
    return {
        outcome: "failed",
        title: text.failedTitle,
        description: text.gradedNote,
        failed: latest.tests.filter((test) => !test.passed).map((test) => cellNameOf(test.id, lab, words)),
    }
}

/**
 * The submit command: grey with its reason until every case is green and the machine is there, and those two preconditions as ticked
 * lines, read by the same rules as the reason (the newest run of every case, the connection the server checks).
 */
const submitOf = (
    lab: CourseLabRead,
    cases: CourseLabCases | undefined,
    words: CourseLabWords,
    isSubmitting: boolean,
): LabSubmitView => {
    const text = words.submit
    const reason = (() => {
        if (cases === undefined || cases.every((each) => each.lastRun === null || each.lastRun === undefined))
            return text.reasonNoRun
        if (!isAllGreen(cases)) return text.reasonRed
        return lab.connectionLost ? text.reasonLost : ""
    })()
    return {
        checks: [
            { id: "green", label: text.checkGreen, isMet: isAllGreen(cases) },
            { id: "machine", label: text.checkMachine, isMet: !lab.connectionLost && deviceOf(lab) === "online" },
        ],
        isDisabled: reason !== "",
        reason,
        isPending: isSubmitting || isGrading(lab),
    }
}

/** What a page of the lab needs besides the read: the words, what the learner picked and what is in flight. */
export type CourseLabContext = {
    readonly words: CourseLabWords
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
    readonly faulty: ReadonlyArray<CourseLabFaulty>
    /** The current case the page passes in, or undefined when it shows none. */
    readonly caseResult: CourseLabCaseResult | undefined
    /** The file the learner picked; empty or unknown opens the default one. */
    readonly chosenPath: string
    readonly tab: "case" | "logs"
    /** The folder text in the field of the setup page. */
    readonly dir: string
    /** True from the moment the lab was asked to start until the machine answers. */
    readonly isStartRequested: boolean
    readonly isSubmitting: boolean
    /** Where the learner stands in each case; undefined until the `courseCases` read answers. */
    readonly cases: CourseLabCases | undefined
}

/** What the pairing step shows. */
export type CourseLabPairing = {
    readonly os: LabOsId
    readonly installCommand: string
    readonly pairCommand: string
    readonly isIssuing: boolean
}

/** The current case as the panel draws it: the page's words and the state in the app's words. */
const caseViewOf = (result: CourseLabCaseResult | undefined, words: CourseLabWords): LabCaseResultView | undefined =>
    result === undefined
        ? undefined
        : {
              title: result.title,
              state: result.status,
              stateLabel: words.caseState(result.status),
              invariant: result.status === "failed" ? result.invariant : "",
              expected: result.status === "failed" ? result.expected : "",
              actual: result.status === "failed" ? result.actual : "",
          }

/** The setup page: the steps, the boot progress once the lab was asked to start and the closing line once it is ready. */
const setupBodyOf = (lab: CourseLabRead, context: CourseLabContext, pairing: CourseLabPairing): LabSetupBody => {
    const device = deviceOf(lab)
    const phase = phaseOf(lab)
    // The last run's report is stale while a new start waits for the machine's first sync (owner 2026-11-28: the rail kept the old times
    // and the old "Lab sẵn sàng" during a new build), and with no machine paired at all; a run the machine already reports live is not.
    const isStale = device === "none" || (context.isStartRequested && phase !== "booting")
    return {
        shape: "setup",
        setup: {
            ...pairing,
            isPaired: device !== "none",
            isOnline: device === "online",
            machine: context.machine,
            dir: context.dir,
            dirError: isDirValid(context.dir) ? "" : context.words.dirInvalid,
            isStarting: context.isStartRequested,
        },
        // The five things the relay does stand on the page before the button is pressed, each waiting, so the learner knows what pressing does.
        boot: isStale ? freshBootOf(context.machine, context.words, context.isStartRequested) : bootOf(lab, context.machine, context.words),
        // The closing line is this run's: hidden while a new run is on its way or with no machine, so its arrival is the moment to celebrate.
        ready: phase === "ready" && !isStale ? { learnerFile: lab.learnerFile ?? "" } : undefined,
    }
}

/** The lab column of a loop page: the learner file as read-only code, the current case and the logs. */
const workBodyOf = (lab: CourseLabRead, context: CourseLabContext): LabWorkBody => {
    const { words } = context
    const paths = lab.files.map((file) => file.path)
    const selectedPath = paths.includes(context.chosenPath) ? context.chosenPath : defaultPathOf(lab, context.faulty)
    const file = lab.files.find((each) => each.path === selectedPath)
    const learner = lab.learnerFile ?? ""
    return {
        shape: "work",
        work: {
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
                          isLearnerFile: learner !== "" && isFileOf(file.path, learner),
                      },
            caseResult: caseViewOf(context.caseResult, words),
            logs: lab.logs.map((log) => ({ service: log.service, lines: log.lines.slice(-LOG_LINES) })),
            tab: context.tab,
            lastSynced: lab.lastSyncedAt === null || lab.lastSyncedAt === undefined ? "" : words.time(lab.lastSyncedAt),
            isOnline: deviceOf(lab) === "online",
        },
    }
}

/** The submit page: the hidden matrix, the grading command and the newest submission. */
const submitBodyOf = (lab: CourseLabRead, context: CourseLabContext): LabSubmitBody => ({
    shape: "submit",
    matrix: matrixOf(lab, context.words),
    submit: submitOf(lab, context.cases, context.words, context.isSubmitting),
    submission: submissionOf(lab, context.words),
})

/**
 * What the lab draws for the stage a page shows: the setup page always (its steps, boot and closing line); the lab column of a loop
 * page and the submit page once the first run is done, and a line that points back to the setup before.
 */
export const bodyOf = (
    stage: CourseLabStage,
    lab: CourseLabRead,
    context: CourseLabContext,
    pairing: CourseLabPairing,
): LabBody => {
    if (stage === "setup") return setupBodyOf(lab, context, pairing)
    // The submit page always shows what grading needs (owner 2026-11-28): its conditions say what is missing, the button stays locked.
    if (stage === "submit") return submitBodyOf(lab, context)
    if (phaseOf(lab) !== "ready") return { shape: "waiting" }
    return workBodyOf(lab, context)
}

/** The placeholder of the first read for a stage: the ready body of the same shape with blank words, so the skeleton is the ready tree. */
export const placeholderBodyOf = (stage: CourseLabStage): LabBody => {
    if (stage === "setup")
        return {
            shape: "setup",
            setup: {
                os: "windows",
                installCommand: " ".repeat(28),
                pairCommand: "",
                isIssuing: false,
                isPaired: false,
                isOnline: false,
                machine: "",
                dir: " ".repeat(24),
                dirError: "",
                isStarting: false,
            },
            boot: undefined,
            ready: undefined,
        }
    if (stage === "work")
        return {
            shape: "work",
            work: {
                files: [1, 2, 3].map((index) => `placeholder-${index}`),
                selectedPath: "placeholder-1",
                code: {
                    path: " ".repeat(16),
                    language: "",
                    code: "\n\n\n\n\n\n",
                    highlightLines: [],
                    isOmitted: false,
                    isLearnerFile: true,
                },
                caseResult: undefined,
                logs: [],
                tab: "case",
                lastSynced: "",
                isOnline: false,
            },
        }
    return {
        shape: "submit",
        matrix: undefined,
        submit: { checks: [], isDisabled: true, reason: "", isPending: false },
        submission: undefined,
    }
}

/** The name of the online machine of the learner, or an empty string when none of them is online. */
export const onlineMachineOf = (
    devices: ReadonlyArray<{ readonly name: string; readonly online: boolean }> | undefined,
): string => devices?.find((device) => device.online)?.name ?? ""
