/**
 * The mcp capability: the StarCi Next lesson companion for the learner's own Claude or ChatGPT.
 *
 * `McpTokenService` mints, lists and revokes the learner's personal access tokens and proves a bearer token on the MCP endpoint;
 * `McpServerFactory.create(learnerId)` builds the server (resources, tools, prompts) for that one learner. Lesson text comes only
 * from `LessonReadService` (the app's own gating), source and scenarios only from the lesson checkout's public catalog, runs
 * only from the learner's own relay events. Hidden tests, mutants, submissions, rubric evidence and answer keys are never read,
 * listed, searched or embedded.
 */
export { MCP_ERROR_KINDS, McpError, McpErrorCode } from "./errors/mcp.error"
export { MCP_MESSAGES } from "./messages/mcp.messages"
export { mcpEntities, mcpMigrations } from "./persistence/connection"
export { McpHarnessService } from "./mcp-harness.service"
export type { McpHarnessReindexReport } from "./mcp-harness.service"
export { McpIndexModule } from "./mcp-index.module"
export { McpModule } from "./mcp.module"
export { McpServerFactory } from "./mcp-server.factory"
export { McpTokenService } from "./mcp-token.service"
export { McpTutorService } from "./mcp-tutor.service"
export { parseMcpConfig } from "./mcp-config.mapper"
export type { McpConnectInfo, McpTokenIssued, McpTokenView } from "./mcp.contracts"
export type { McpIndexOptions } from "./mcp-index.options"
export type { McpOptions } from "./mcp.options"
