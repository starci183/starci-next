import { isRecord } from "@modules/platform/primitives"
import type { AgentRun, HarnessTool, ToolAction } from "./harness-trial.contracts"

const SHELL_TOOLS = ["Bash", "PowerShell", "BashOutput"]
const READ_TOOLS = ["Read", "Grep", "Glob", "NotebookRead"]
const WRITE_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit"]

const textOf = (value: unknown): string => (typeof value === "string" ? value : "")

const lineJson = (line: string): Record<string, unknown> | null => {
    const trimmed = line.trim()
    if (!trimmed.startsWith("{")) return null
    try {
        const parsed: unknown = JSON.parse(trimmed)
        return isRecord(parsed) ? parsed : null
    } catch {
        return null
    }
}

const pathsOf = (input: Record<string, unknown>): ReadonlyArray<string> =>
    ["file_path", "path", "notebook_path"].flatMap((key) =>
        typeof input[key] === "string" ? [String(input[key])] : [],
    )

const toolAction = (block: Record<string, unknown>): ToolAction => {
    const name = textOf(block["name"])
    const input = isRecord(block["input"]) ? block["input"] : {}
    const kind = SHELL_TOOLS.includes(name)
        ? "shell"
        : READ_TOOLS.includes(name)
          ? "read"
          : WRITE_TOOLS.includes(name)
            ? "write"
            : "other"
    return {
        id: textOf(block["id"]),
        kind,
        command: kind === "shell" ? textOf(input["command"]) : "",
        paths: pathsOf(input),
        isError: null,
        exitCode: null,
    }
}

/** The exit code in the text a failed shell call returns (`Exit code 1`), or 1 when it gives none. */
const exitCodeOf = (content: unknown): number => {
    const text = typeof content === "string" ? content : JSON.stringify(content)
    const match = /Exit code[: ]+(\d+)/u.exec(text)
    return match === null ? 1 : Number(match[1])
}

/**
 * Reads the lines `claude -p --output-format stream-json --verbose` printed: an `assistant` message holds `tool_use` blocks, the next
 * `user` message holds their `tool_result` blocks (`is_error` true when the call was refused or failed), and the last `result`
 * line holds the usage.
 */
export const claudeRunOf = (lines: ReadonlyArray<string>): AgentRun => {
    const actions = new Map<string, ToolAction>()
    let inputTokens: number | null = null
    let outputTokens: number | null = null
    let answer = ""
    lines.forEach((line) => {
        const event = lineJson(line)
        if (event === null) return
        const message = isRecord(event["message"]) ? event["message"] : null
        const content: unknown = message?.["content"]
        if (event["type"] === "assistant" && Array.isArray(content)) {
            ;(content as ReadonlyArray<unknown>).forEach((block) => {
                if (isRecord(block) && block["type"] === "tool_use") {
                    const action = toolAction(block)
                    actions.set(action.id, action)
                }
            })
        }
        if (event["type"] === "user" && Array.isArray(content)) {
            ;(content as ReadonlyArray<unknown>).forEach((block) => {
                if (!isRecord(block) || block["type"] !== "tool_result") return
                const known = actions.get(textOf(block["tool_use_id"]))
                if (known === undefined) return
                const isError = block["is_error"] === true
                actions.set(known.id, {
                    ...known,
                    isError,
                    exitCode: known.kind === "shell" ? (isError ? exitCodeOf(block["content"]) : 0) : null,
                })
            })
        }
        if (event["type"] === "result" && typeof event["result"] === "string") answer = event["result"]
        if (event["type"] === "result" && isRecord(event["usage"])) {
            const usage = event["usage"]
            inputTokens = typeof usage["input_tokens"] === "number" ? usage["input_tokens"] : inputTokens
            outputTokens = typeof usage["output_tokens"] === "number" ? usage["output_tokens"] : outputTokens
        }
    })
    return { actions: [...actions.values()], message: answer, inputTokens, outputTokens }
}

const codexItem = (item: Record<string, unknown>): ToolAction | null => {
    const id = textOf(item["id"])
    if (item["type"] === "command_execution") {
        const exit = typeof item["exit_code"] === "number" ? item["exit_code"] : null
        return {
            id,
            kind: "shell",
            command: textOf(item["command"]),
            paths: [],
            isError: exit === null ? item["status"] === "failed" : exit !== 0,
            exitCode: exit,
        }
    }
    if (item["type"] === "file_change" && Array.isArray(item["changes"])) {
        const paths = (item["changes"] as ReadonlyArray<unknown>).flatMap((change) =>
            isRecord(change) && typeof change["path"] === "string" ? [change["path"]] : [],
        )
        return { id, kind: "write", command: "", paths, isError: item["status"] === "failed", exitCode: null }
    }
    return null
}

/** Reads the JSONL `codex exec --json` printed: finished `command_execution` and `file_change` items, and `turn.completed` usage. */
export const codexRunOf = (lines: ReadonlyArray<string>): AgentRun => {
    const actions: Array<ToolAction> = []
    let inputTokens: number | null = null
    let outputTokens: number | null = null
    let answer = ""
    lines.forEach((line) => {
        const event = lineJson(line)
        if (event === null) return
        if (
            event["type"] === "item.completed" &&
            isRecord(event["item"]) &&
            event["item"]["type"] === "agent_message"
        ) {
            answer = textOf(event["item"]["text"])
        }
        if (event["type"] === "item.completed" && isRecord(event["item"])) {
            const action = codexItem(event["item"])
            if (action !== null) actions.push(action)
        }
        if (event["type"] === "turn.completed" && isRecord(event["usage"])) {
            const usage = event["usage"]
            inputTokens = (inputTokens ?? 0) + (typeof usage["input_tokens"] === "number" ? usage["input_tokens"] : 0)
            outputTokens =
                (outputTokens ?? 0) + (typeof usage["output_tokens"] === "number" ? usage["output_tokens"] : 0)
        }
    })
    return { actions, message: answer, inputTokens, outputTokens }
}

/** The run of an event stream, read the way its tool prints it. */
export const agentRunOf = (tool: HarnessTool, lines: ReadonlyArray<string>): AgentRun =>
    tool === "claude" ? claudeRunOf(lines) : codexRunOf(lines)
