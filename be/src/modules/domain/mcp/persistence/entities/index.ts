import { McpTokenEntity } from "./mcp-token.entity"

export { McpTokenEntity }

/** The entities of the mcp capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const mcpEntities: ReadonlyArray<new () => object> = [McpTokenEntity]
