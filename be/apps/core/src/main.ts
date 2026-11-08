import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { SystemClockService } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { applyHttpSecurity, HTTP_JSON_BODY_LIMIT } from "@modules/platform/http-security"
import { createJsonLogger, LoggingLogEvent } from "@modules/platform/logging"
import { AppModule } from "./app.module"
import { readCoreEnv } from "./core.env"

/** Reads the environment once, composes the app from the parsed options and serves until a shutdown signal. */
const bootstrap = async (): Promise<void> => {
    const env = EnvSource.fromProcess()
    const options = readCoreEnv(env)
    const app = await NestFactory.create<NestExpressApplication>(AppModule.register(options), { rawBody: true })
    app.useBodyParser("json", { limit: HTTP_JSON_BODY_LIMIT })
    applyHttpSecurity(app, options.httpSecurity, { trustProxy: 1 })
    app.enableShutdownHooks()
    await app.listen(options.server.port)
    createJsonLogger(new SystemClockService()).info(LoggingLogEvent.ServerStarted, {
        service: "core",
        port: options.server.port,
    })
}

bootstrap().catch((error: unknown) => {
    createJsonLogger(new SystemClockService()).error(LoggingLogEvent.StartupFailed, error, { service: "core" })
    process.exitCode = 1
})
