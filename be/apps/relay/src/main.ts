import { NestFactory } from "@nestjs/core"
import { SystemClockService } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { applyHttpSecurity } from "@modules/platform/http-security"
import { createJsonLogger, LoggingLogEvent } from "@modules/platform/logging"
import { applyRealtime } from "@modules/platform/realtime"
import { AppModule } from "./app.module"
import { readRelayEnv } from "./relay.env"

/** Reads the environment once, composes the relay app, serves its socket and upload doors until a shutdown signal. */
const bootstrap = async (): Promise<void> => {
    const env = EnvSource.fromProcess()
    const options = readRelayEnv(env)
    const app = await NestFactory.create(AppModule.register(options))
    applyHttpSecurity(app, options.httpSecurity, { trustProxy: 1 })
    applyRealtime(app)
    app.enableShutdownHooks()
    await app.listen(options.server.port)
    createJsonLogger(new SystemClockService()).info(LoggingLogEvent.ServerStarted, {
        service: "relay",
        port: options.server.port,
    })
}

bootstrap().catch((error: unknown) => {
    createJsonLogger(new SystemClockService()).error(LoggingLogEvent.StartupFailed, error, { service: "relay" })
    process.exitCode = 1
})
