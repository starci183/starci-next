import { LoggingLogEvent } from "./logging.log-events"
import type { LogFields, Logger } from "./logging.port"
import { createNestLogger } from "./nest-logger.service"

interface Line {
    readonly level: string
    readonly event: string
    readonly cause?: unknown
    readonly message: unknown
    readonly context: unknown
}

const build = (quiet: boolean) => {
    const out: Array<Line> = []
    const record = (level: string, event: string, cause: unknown, fields?: LogFields): void => {
        out.push({ level, event, cause, message: fields?.message, context: fields?.context })
    }
    const logger: Logger = {
        info: (event, fields) => record("info", event, undefined, fields),
        warn: (event, fields) => record("warn", event, undefined, fields),
        error: (event, cause, fields) => record("error", event, cause, fields),
    }
    return { out, adapter: createNestLogger(logger, quiet) }
}

describe("NestLoggerService", () => {
    it("writes every framework level under its owned event, with the textual context", () => {
        const { out, adapter } = build(false)
        const failure = new Error("bootstrap failed")

        adapter.log("started", "NestApplication")
        adapter.warn("recovering", "Injector")
        adapter.debug?.(42)
        adapter.verbose?.({ operation: "bootstrap" }, { ignored: "unstructured" })
        adapter.error(failure, failure.stack, "ExceptionHandler")
        adapter.fatal?.("stopping")

        expect(out.map((line) => [line.level, line.event, line.message, line.context])).toEqual([
            ["info", LoggingLogEvent.FrameworkLog, "started", "NestApplication"],
            ["warn", LoggingLogEvent.FrameworkWarning, "recovering", "Injector"],
            ["info", LoggingLogEvent.FrameworkDebug, "42", undefined],
            ["info", LoggingLogEvent.FrameworkVerbose, "[object Object]", undefined],
            ["error", LoggingLogEvent.FrameworkError, "Error: bootstrap failed", "ExceptionHandler"],
            ["error", LoggingLogEvent.FrameworkFatal, "stopping", undefined],
        ])
        expect(out[4]?.cause).toBe(failure)
    })

    it("keeps only warnings and errors when quiet", () => {
        const { out, adapter } = build(true)

        adapter.log("started")
        adapter.debug?.("detail")
        adapter.verbose?.("more")
        adapter.warn("careful")
        adapter.error("broken")

        expect(out.map((line) => line.level)).toEqual(["warn", "error"])
    })
})
