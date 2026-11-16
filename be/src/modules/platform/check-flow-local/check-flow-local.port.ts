/** One process to run on the learner's machine. */
export interface ProcessSpec {
    /** The program, or with `shell` the whole command text. */
    readonly command: string
    /** The arguments (ignored with `shell`). */
    readonly args: ReadonlyArray<string>
    /** The working folder. */
    readonly cwd: string
    /** The environment; the process's own when absent. */
    readonly env?: Readonly<Record<string, string | undefined>>
    /** Text written to standard input, which is then closed. */
    readonly stdin?: string
    /** Stopped after this many milliseconds. */
    readonly timeoutMs: number
    /** Whether `command` is shell text. */
    readonly shell: boolean
    /** Called with each line of standard output as it arrives. */
    readonly onStdoutLine?: (line: string) => void
}

/** What a process did. */
export interface ProcessResult {
    /** The exit code; -1 when it could not start or was stopped. */
    readonly exitCode: number
    /** All of standard output. */
    readonly stdout: string
    /** All of standard error. */
    readonly stderr: string
    /** Whether the timeout stopped it. */
    readonly timedOut: boolean
    /** How long it ran, in milliseconds. */
    readonly ms: number
}

/** Runs processes on the learner's machine; a spec binds a fake. It never rejects. */
export interface ProcessPort {
    /** Runs one process to its end. */
    run(spec: ProcessSpec): Promise<ProcessResult>
}
