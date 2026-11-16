import { McpTokenEntity } from "./entities/mcp-token.entity"
import { InitMcp1798300000000 } from "./migrations/1798300000000-init-mcp"

/** The entities of the mcp capability, for the connection that holds them. */
export const mcpEntities: Array<typeof McpTokenEntity> = [McpTokenEntity]

/** The migrations of the mcp capability, in the order they run. */
export const mcpMigrations: Array<typeof InitMcp1798300000000> = [InitMcp1798300000000]
