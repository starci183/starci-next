import type { LoggerService } from "@nestjs/common"
import { LoggingLogEvent } from "./logging.log-events"
import type { LogFields, Logger } from "./logging.port"

/** Keeps the framework's message and optional textual context without dumping unstructured extra arguments. */
const fieldsOf = (message: unknown, optionalParams: ReadonlyArray<unknown>): LogFields => {
    const context = optionalParams.at(-1)
    return { message: String(message), ...(typeof context === "string" ? { context } : {}) }
}

/** Routes Nest's own bootstrap and runtime messages through the app's logging port; `quiet` keeps only warnings and errors. */
export class NestLoggerService implements LoggerService {
    constructor(
        private readonly logger: Logger,
        private readonly quiet: boolean,
    ) {}

    /** Records an ordinary framework lifecycle message. */
    log(message: unknown, ...optionalParams: Array<unknown>): void {
        this.note(LoggingLogEvent.FrameworkLog, message, optionalParams)
    }

    /** Keeps the framework's error as the cause for the logging adapter's structured serialization. */
    error(message: unknown, ...optionalParams: Array<unknown>): void {
        this.fail(LoggingLogEvent.FrameworkError, message, optionalParams)
    }

    /** Records a recoverable framework warning. */
    warn(message: unknown, ...optionalParams: Array<unknown>): void {
        this.logger.warn(LoggingLogEvent.FrameworkWarning, fieldsOf(message, optionalParams))
    }

    /** Preserves debug identity on the JSON port's informational stream. */
    debug(message: unknown, ...optionalParams: Array<unknown>): void {
        this.note(LoggingLogEvent.FrameworkDebug, message, optionalParams)
    }

    /** Preserves verbose identity on the JSON port's informational stream. */
    verbose(message: unknown, ...optionalParams: Array<unknown>): void {
        this.note(LoggingLogEvent.FrameworkVerbose, message, optionalParams)
    }

    /** Records a fatal framework failure through the error stream. */
    fatal(message: unknown, ...optionalParams: Array<unknown>): void {
        this.fail(LoggingLogEvent.FrameworkFatal, message, optionalParams)
    }

    private note(event: LoggingLogEvent, message: unknown, params: ReadonlyArray<unknown>): void {
        if (!this.quiet) this.logger.info(event, fieldsOf(message, params))
    }

    private fail(event: LoggingLogEvent, message: unknown, params: ReadonlyArray<unknown>): void {
        this.logger.error(event, message, fieldsOf(message, params))
    }
}

/** Supplies NestFactory or CommandFactory with the same Logger port used by application code; `quiet` drops lifecycle chatter (a command line). */
export const createNestLogger = (logger: Logger, quiet: boolean = false): LoggerService =>
    new NestLoggerService(logger, quiet)
