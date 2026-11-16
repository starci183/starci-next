import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { McpHarnessFile } from "./mcp-harness.policy"

/**
 * The port that reads the harness content (the guides and docs of the content checkout). It lists markdown files; the policy
 * decides which of them the index may read, so an adapter that lists too much still indexes only guides and docs. An object,
 * not a bare function, so a unit spec doubles it.
 */
export interface McpHarnessSource {
    /** The markdown files of the harness content, or an empty list when no content checkout is declared. */
    files(): Promise<ReadonlyArray<McpHarnessFile>>
}

/** Token of the port that reads the harness content. */
export const MCP_HARNESS_SOURCE: unique symbol = Symbol("domain.mcp.harness-source")

/** Injects the port that reads the harness content. Parameter type: McpHarnessSource. */
export const InjectMcpHarnessSource = (): TypedParameterDecorator<McpHarnessSource> =>
    injector<McpHarnessSource>(MCP_HARNESS_SOURCE)
