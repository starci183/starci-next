import type { LessonRunOptions } from "./lesson.contracts"

/** What `starci-next init` is given. */
export interface InitOptions {
    /** A checkout of starci-next-data to read the kit from, or undefined for the environment's or the relay's. */
    readonly from?: string | undefined
    /** The StarCi project id to write into `starci/project.yaml`, or undefined to leave the placeholder. */
    readonly project?: string | undefined
    /** typescript, java, csharp or go; typescript when undefined. */
    readonly language?: string | undefined
    /** Whether files that already exist are replaced. */
    readonly force: boolean
}

/** The learner's machine as the relay sees it: each method runs one learner command and sets the process exit code. */
export interface RelayClientPort {
    /** Pairs this machine: prints the code and the page, then waits for the learner to confirm it on the web. */
    login(): Promise<void>
    /** Forgets this machine's device token. */
    logout(): Promise<void>
    /** Prints where StarCi is and whether this machine is paired. */
    status(): Promise<void>
    /** Points at the devices page, where the learner sees and revokes paired devices. */
    devices(): Promise<void>
    /** Runs a task's StarCi-signed checks here and sends the results as practice; the first argument names the task, `yes` skips the question. */
    run(args: ReadonlyArray<string>, yes: boolean): Promise<void>
    /** Clones a lesson repo at the commit StarCi signed (TypeScript only). */
    pull(lesson: string, lang: string | undefined): Promise<void>
    /** docker compose up or down of the pulled lesson. */
    compose(action: "up" | "down"): Promise<void>
    /** Runs the signed scenarios of a lesson (check: all when none is named). */
    lessonRun(lesson: string, options: LessonRunOptions, isCheck: boolean): Promise<void>
    /** Prints the ready-to-paste fix prompt of a scenario. */
    prompt(lesson: string, scenario: string | undefined): Promise<void>
    /** Copies the project kit (`starci/` and a CI workflow) into the project in the current folder. */
    init(options: InitOptions): Promise<void>
}
