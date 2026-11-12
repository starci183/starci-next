import type { DynamicModule, Type } from "@nestjs/common"
import { SepayHttpModule } from "@features/webhooks/sepay"
import { PayosHttpModule } from "@features/webhooks/payos"
import { ProjectCiHttpModule } from "@features/webhooks/project-ci"
import { InboxModule } from "@modules/platform/inbox"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"

/** The signed webhook transports of the app; `starci app add webhook` registers each generated door here. */
export const webhooksModules = (): Array<Type<unknown> | DynamicModule> => [
    InboxModule.register({ isGlobal: true, connection: PRIMARY_ENTITY_MANAGER }),
    SepayHttpModule.register({}),
    PayosHttpModule.register({}),
    ProjectCiHttpModule.register({}),
]
