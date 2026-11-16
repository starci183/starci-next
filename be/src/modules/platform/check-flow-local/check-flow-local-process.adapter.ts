import { spawn } from "node:child_process"
import type { ProcessPort, ProcessResult, ProcessSpec } from "./check-flow-local.port"

/** The characters kept per stream; the rest is dropped so a chatty process cannot fill memory. */
const OUTPUT_MAX = 8 * 1024 * 1024

/** Whether a program is a Node script, which runs through this process's own Node (a fake binary in a spec, a `.js` bin). */
const isNodeScript = (command: string): boolean => /\.(?:c|m)?js$/u.test(command)

/** Runs a process with node:child_process: no shell unless asked, a deadline, the output kept as text. */
export class NodeProcessPort implements ProcessPort {
    /** Runs one process to its end. */
    run(spec: ProcessSpec): Promise<ProcessResult> {
        const started = performance.now()
        return new Promise((resolve) => {
            const script = !spec.shell && isNodeScript(spec.command)
            const command = script ? process.execPath : spec.command
            const args = script ? [spec.command, ...spec.args] : [...spec.args]
            let stdout = ""
            let stderr = ""
            let pending = ""
            let timedOut = false
            let settled = false
            let timer: NodeJS.Timeout | undefined
            const finish = (exitCode: number): void => {
                if (settled) return
                settled = true
                clearTimeout(timer)
                if (pending !== "") spec.onStdoutLine?.(pending)
                resolve({ exitCode, stdout, stderr, timedOut, ms: Math.round(performance.now() - started) })
            }
            const child = spawn(command, args, {
                cwd: spec.cwd,
                env: spec.env === undefined ? process.env : (spec.env as NodeJS.ProcessEnv),
                shell: spec.shell,
                windowsHide: true,
                stdio: ["pipe", "pipe", "pipe"],
            })
            timer = setTimeout(() => {
                timedOut = true
                child.kill("SIGKILL")
            }, spec.timeoutMs)
            child.stdout.on("data", (chunk: Buffer) => {
                const text = chunk.toString("utf8")
                if (stdout.length < OUTPUT_MAX) stdout += text
                if (spec.onStdoutLine === undefined) return
                const lines = (pending + text).split(/\r?\n/u)
                pending = lines.pop() ?? ""
                lines.forEach((line) => spec.onStdoutLine?.(line))
            })
            child.stderr.on("data", (chunk: Buffer) => {
                if (stderr.length < OUTPUT_MAX) stderr += chunk.toString("utf8")
            })
            child.on("error", (cause) => {
                stderr += cause.message
                finish(-1)
            })
            child.on("close", (code) => finish(timedOut ? -1 : (code ?? -1)))
            child.stdin.on("error", () => undefined)
            child.stdin.end(spec.stdin ?? "")
        })
    }
}
