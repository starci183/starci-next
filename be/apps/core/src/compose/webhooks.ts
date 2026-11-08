import type { DynamicModule, Type } from "@nestjs/common"
import { SepayHttpModule } from "@features/webhooks/sepay"
import { PayosHttpModule } from "@features/webhooks/payos"
import { ProjectCiHttpModule } from "@features/webhooks/project-ci"

/** The signed webhook transports of the app; `starci app add webhook` registers each generated door here. */
export const webhooksModules = (): Array<Type<unknown> | DynamicModule> => [
    SepayHttpModule.register({}),
    PayosHttpModule.register({}),
    ProjectCiHttpModule.register({}),
]
