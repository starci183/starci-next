import type { DynamicModule, Type } from "@nestjs/common"
import { CommerceGraphqlModule } from "@features/api/commerce"
import { IdentityHttpModule } from "@features/api/identity"
import { GraphqlModule } from "@modules/platform/graphql"

/** The API transports of the app; `starci app add api` registers each generated door here. */
export const apiModules = (): Array<Type<unknown> | DynamicModule> => [
    GraphqlModule.register({ isGlobal: true }),
    CommerceGraphqlModule.register({}),
    IdentityHttpModule.register({}),
]
