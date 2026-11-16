import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./mcp-graphql.module-definition"
import { McpTokenResolver } from "./mcp-token.resolver"

@Module({ providers: [McpTokenResolver] })
/** The GraphQL transport of the learner AI connection: endpoint info and the access tokens. */
export class McpGraphqlModule extends ConfigurableModuleClass {}
