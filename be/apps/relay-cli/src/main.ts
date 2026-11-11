import "reflect-metadata"
import { CommandFactory } from "nest-commander"
import { SystemClockService } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { createJsonLogger, createNestLogger, LoggingLogEvent } from "@modules/platform/logging"
import { AppModule } from "./app.module"
import { createRelayCliAppOptions } from "./relay-cli.options"
import { readRelayCliEnv } from "./relay-cli.env"

/** The learner command line: reads the environment once and runs the command its arguments name (`starci-next run <task>`). */
async function bootstrap(): Promise<void> {
    const logger = createJsonLogger(new SystemClockService())
    await CommandFactory.run(AppModule.register(createRelayCliAppOptions(readRelayCliEnv(EnvSource.fromProcess()))), {
        cliName: "starci-next",
        logger: createNestLogger(logger, true),
        errorHandler: (error: Error) => {
            if ("exitCode" in error && typeof error.exitCode === "number") process.exit(error.exitCode)
            logger.error(LoggingLogEvent.StartupFailed, error, { service: "relay-cli" })
            process.exit(1)
        },
    })
}

bootstrap().catch((error: unknown) => {
    createJsonLogger(new SystemClockService()).error(LoggingLogEvent.StartupFailed, error, { service: "relay-cli" })
    process.exit(1)
})
