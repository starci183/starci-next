import type { DynamicModule } from "@nestjs/common"
import { ClockModule } from "@modules/platform/clock"
import { DatabaseModule, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PRIMARY_ENTITIES } from "@modules/platform/database/entities"
import { HttpModule } from "@modules/platform/http"
import { InboxModule } from "@modules/platform/inbox"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import type { CliAppOptions } from "../cli.options"

/** The clock, logger and primary database connection shared by CLI commands. */
export const platformModules = (options: CliAppOptions): Array<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    HttpModule.register({ isGlobal: true }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [options.database],
        entities: PRIMARY_ENTITIES,
    }),
    // The inbox the harness CI service dedupes deliveries with: the cli composes the same HarnessModule as the core api.
    InboxModule.register({ isGlobal: true, connection: PRIMARY_ENTITY_MANAGER }),
]
