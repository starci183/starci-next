import { Module } from "@nestjs/common"
import { McpApiModule } from "../../mcp.module"
import { ConfigurableModuleClass } from "./mcp-graphql.module-definition"
import { McpTokenResolver } from "./mcp-token.resolver"

@Module({ imports: [McpApiModule.register({})], providers: [McpTokenResolver] })
/** The GraphQL transport of the learner AI connection: endpoint info and the access tokens. */
export class McpGraphqlModule extends ConfigurableModuleClass {}
