import { Module, type DynamicModule } from "@nestjs/common"
import { APP_FILTER, APP_GUARD } from "@nestjs/core"
import { AuthGuard, CredentialGuard } from "@modules/domain/identity"
import { ErrorsFilter } from "@modules/platform/errors"
import { OriginGuard, RateLimitGuard } from "@modules/platform/http-security"
import { platformModules } from "./compose/platform"
import { integrationsModules } from "./compose/integrations"
import { identityModules } from "./compose/identity"
import { commerceModules } from "./compose/commerce"
import { learningModules } from "./compose/learning"
import { careerModules } from "./compose/career"
import { systemModules } from "./compose/system"
import { apiModules } from "./compose/api"
import { webhooksModules } from "./compose/webhooks"
import { realtimeModules } from "./compose/realtime"
import type { CoreOptions } from "./core.options"

@Module({})
/** Composition root of the core app: it spreads the composition groups of `compose/`, and the four guards run in a fixed order. */
export class AppModule {
    /** Builds the module from options parsed once at boot; nothing here reads the environment. */
    static register(options: CoreOptions): DynamicModule {
        return {
            module: AppModule,
            imports: [
                ...platformModules(options),
                ...integrationsModules(options),
                ...identityModules(options),
                ...commerceModules(options),
                ...learningModules(options),
                ...careerModules(options),
                ...systemModules(),
                ...apiModules(),
                ...webhooksModules(),
                ...realtimeModules(),
            ],
            providers: [
                { provide: APP_FILTER, useClass: ErrorsFilter },
                { provide: APP_GUARD, useClass: RateLimitGuard },
                { provide: APP_GUARD, useClass: OriginGuard },
                { provide: APP_GUARD, useClass: CredentialGuard },
                { provide: APP_GUARD, useClass: AuthGuard },
            ],
        }
    }
}
