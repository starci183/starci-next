import { spawn } from "node:child_process"
import { hostname, platform } from "node:os"
import { createInterface } from "node:readline/promises"
import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { CheckRun, TerminalPort } from "./relay-client.contracts"

@Injectable()
/** The real terminal of this process: its standard streams, the shell, the host name and platform of this machine. */
export class TerminalClient implements TerminalPort {
    constructor(@InjectClock() private readonly clock: Clock) {}

    /** Prints one line to the standard output. */
    out(line: string): void {
        process.stdout.write(`${line}\n`)
    }

    /** Prints one line to the standard error. */
    err(line: string): void {
        process.stderr.write(`${line}\n`)
    }

    /** The host name of this machine. */
    hostName(): string {
        return hostname()
    }

    /** The Node platform name of this machine. */
    platform(): string {
        return platform()
    }

    /** Sets the exit code of this process, which ends with it once the command returns. */
    exit(code: number): void {
        process.exitCode = code
    }

    /** Asks a yes/no question on the terminal; only y or yes is a yes. */
    async confirm(question: string): Promise<boolean> {
        const reader = createInterface({ input: process.stdin, output: process.stdout })
        const answer = await reader.question(`${question} [y/N] `)
        reader.close()
        return /^y(es)?$/iu.test(answer.trim())
    }

    /** Runs one confirmed command through the shell, echoing its output, stopped after its timeout. */
    runCommand(command: string, cwd: string, timeoutMs: number): Promise<CheckRun> {
        return new Promise((resolve) => {
            const started = this.clock.now().getTime()
            let output = ""
            const finish = (exitCode: number): void =>
                resolve({ exitCode, output, durationMs: this.clock.now().getTime() - started })
            const child = spawn(command, { cwd, shell: true, timeout: timeoutMs })
            child.stdout.on("data", (chunk: Buffer) => {
                output += chunk.toString("utf8")
                process.stdout.write(chunk)
            })
            child.stderr.on("data", (chunk: Buffer) => {
                output += chunk.toString("utf8")
                process.stderr.write(chunk)
            })
            child.on("close", (code) => finish(code ?? -1))
            child.on("error", () => finish(-1))
        })
    }
}
