import { McpTokenEntity } from "./entities/mcp-token.entity"
import { InitMcp1798300000000 } from "./migrations/1798300000000-init-mcp"
import { AddMcpVectorPoints1798400000000 } from "./migrations/1798400000000-add-mcp-vector-points"

/** The entities of the mcp capability, for the connection that holds them (the vector point rows are read and written as SQL). */
export const mcpEntities: Array<typeof McpTokenEntity> = [McpTokenEntity]

/** The migrations of the mcp capability, in the order they run. */
export const mcpMigrations: Array<typeof InitMcp1798300000000 | typeof AddMcpVectorPoints1798400000000> = [
    InitMcp1798300000000,
    AddMcpVectorPoints1798400000000,
]
