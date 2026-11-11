import type { DynamicModule } from "@nestjs/common"
import { ClockModule } from "@modules/platform/clock"
import { HttpModule } from "@modules/platform/http"
import { IdsModule } from "@modules/platform/ids"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"

/** The clock, ids, timer, outbound HTTP port and logger the learner commands run with; this app has no database. */
export const platformModules = (): Array<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    IdsModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    HttpModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
]
